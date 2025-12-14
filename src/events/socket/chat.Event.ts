import { Server, Socket } from "socket.io";
import { RedisHelpers } from "../../utils/redisHelper";
import { chatService } from "../../services";
import { publishMessage } from "../../events/redis/chat.Pub";
import { subscribeToChannel } from "../../events/redis/chat.sub";
import { IMessage } from "interfaces/chat.interface";
import { ChatRoom, Message } from "models/chat.Models";

export const registerChatEvents = (
  io: Server,
  socket: Socket,
  userId: string
) => {
  socket.on("chat:init", async ({ userId, toUserId }) => {
    try {
      const room = await chatService.createSingleRoom({ userId, toUserId });
      console.log("room", room[0]);

      const roomId = room[0]._id?.toString()
      console.log(`User ${userId} joined room ${roomId}`);
      socket.join(roomId);
      await RedisHelpers.addUserToRoom(roomId, userId);

      socket.emit("chat:init:success", room[0]);
    } catch (err) {
      console.error("❌ chat:init error:", err);
      socket.emit("chat:error", { message: "Chat init failed" });
    }
  });

  socket.on("chat:join", async (roomId: string) => {
    console.log('room milgaya: ', roomId);
    socket.join(roomId);
    await RedisHelpers.addUserToRoom(roomId, userId);
    await subscribeToChannel(roomId, (data) => {
      io.to(roomId).emit('chat:new_message', data);
      if (data.message.media?.length > 0) {
        data.recivers?.forEach((rid: string) => {
          io.to(data.message.sender?._id).emit("room:update", data.room, data.message);
          io.to(rid).emit("room:update", data.room, data.message);
        });
      }
    });

  });

  socket.on("chat:leave", async (roomId: string, userId: string) => {
    socket.leave(roomId);
    await RedisHelpers.removeUserFromRoom(roomId, userId)
  })

  socket.on("send:message", async (data) => {
    try {
      if (!data) throw new Error("data is missing.");

      const { message, room, receiverIds } = await chatService.sendMessage(data);

      if (!message || !room) {
        throw new Error("send message failed.");
      }

      const roomId = room._id.toString();
      const senderId = message.sender._id.toString();

      const payload = {
        room,
        message: {
          ...message,
          lastMessage: message.content
        }
      };

      await publishMessage(roomId, payload);

      io.to(roomId).emit("chat:new_message", payload.message);

      io.to(senderId).emit("room:update", room, payload.message);

      receiverIds?.forEach((rid: string) => {
        io.to(rid).emit("room:update", room, payload.message);
      });


    } catch (error: any) {
      console.error("❌ send:message error:", error);
      socket.emit("chat:error", { message: error.message || "Internal error" });
    }
  });

  socket.on("typing:start", async ({ roomId, user }) => {
    console.log("🚀 Received typing:start:", { roomId, user });
    // user = { id, name }
    await RedisHelpers.setUserTyping(roomId, user);

    const typingUsers = await RedisHelpers.getTypingUsers(roomId);
    io.to(roomId).emit("typing:update", { roomId, typingUsers });
  });

  socket.on("typing:stop", async ({ roomId, userId }) => {
    await RedisHelpers.removeUserTyping(roomId, userId);

    const typingUsers = await RedisHelpers.getTypingUsers(roomId);
    console.log("🧠 Typing users after SET:", typingUsers);

    io.to(roomId).emit("typing:update", { roomId, typingUsers });
  });

  socket.on("unsend:message", async ({ messageId, roomId, userId }) => {
    try {

      const { message, receiverIds } = await chatService.unsendMessage({ messageId, roomId, userId });
      if (!message) {
        throw new Error("Unsend message failed.");
      }
      console.log("successfull:", message);
      const senderId = message?.sender?._id.toString();
      // io.to(roomId).emit("message:unsend:success", { message });

      io.to(roomId).emit("message:unsent", { message });

      io.to(senderId).emit("unsend:update:room", message)

      receiverIds?.forEach((rsd) => {
        io.to(rsd).emit("unsend:update:room", message)
      })


    } catch (error: any) {
      console.error("❌ unsend:message error:", error);
      socket.emit("chat:error", { message: error.message || "Internal error" });
    }
  });

  socket.on("message:edit", async ({ messageId, roomId, newContent, userId }) => {
    try {
      const message = await chatService.editMessage(messageId, roomId, newContent, userId);
      console.log("Edit successfull:", message);
      if (!message) {
        throw new Error("Edit message failed.");
      }
      io.to(roomId).emit("message:edit:success", { message });
    } catch (error: any) {
      console.error("❌ message:edit error:", error);
      socket.emit("chat:error", { message: error.message || "Internal error" });
    }
  });

  socket.on("clear:chat", async ({ byUser, roomId }) => {

    console.log("id's: ", byUser, roomId);

    await chatService.clearChat(byUser, roomId)
    io.to(roomId).emit("clear:chat:success", { roomId, byUser });
  })

  socket.on("room:read", async ({ userId, roomId }) => {
    const updatedCounts = await chatService.readChat(userId, roomId)
    io.to(userId).emit("room:unread:reset", updatedCounts)
  })

  socket.on("message:seen", async ({ userId, roomId, messageId }) => {
    console.log("message is reading");

    const seenMessages = await chatService.MessageSeenUpdate(userId, roomId, messageId);
    if (!seenMessages) return;
    console.log("message: ", JSON.parse(JSON.stringify(seenMessages)));

    const senderId = seenMessages?.sender?._id.toString();
    io.to(senderId).emit("message:seen:success", seenMessages)
  })

  socket.on("accept:message_request", async ({ userId, roomId, createdBy }) => {
    console.log(userId,roomId,createdBy);
    
    if (!userId || !roomId || !createdBy) throw new Error("fields are missing!")
        const result = await chatService.acceptMessageRequest(userId,roomId,createdBy)
        if(result){
          result?.participants.map((u)=>{
            io.to(u?.user.toString()).emit("accept:message_request:success",result)
          })
        }
  })
};
