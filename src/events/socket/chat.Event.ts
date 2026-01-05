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
  socket.on("chat:join", async (roomId: string) => {
    socket.join(roomId);
    await RedisHelpers.addUserToRoom(roomId, userId);
    const updatedCounts = await chatService.readChat(userId, roomId)
    io.to(userId).emit("room:unread:reset", updatedCounts)
  });


  socket.on("chat:leave", async (roomId: string, userId: string) => {
    socket.leave(roomId);
    await RedisHelpers.removeUserFromRoom(roomId, userId)
  })

  socket.on("send:message", async (payload) => {
    console.log("get in socket");

    const result = await chatService.sendTextMessage(payload);
    console.log("created", result);

    const { room, message, receivers, senderSocketId, tempId } = result;

    await publishMessage(room._id.toString(), {
      roomId: room._id.toString(),
      room,
      message,
      receivers,
      tempId,
      senderSocketId,
    });
  });

  socket.on("unsend:message", async ({ messageId, roomId, deletedBy }) => {
    try {
      const { message, room, shouldUpdateLastMessage } = await chatService.unsendMessage({
        messageId,
        roomId,
        userId: deletedBy,
      });

      if (!message) {
        throw new Error("Unsend message failed.");
      }

      io.to(roomId).emit("message:deleted", {
        roomId,
        messageId: message._id,
      });

      const plainMessage = message.toObject ? message.toObject() : message;
      const finalRoomId = plainMessage.roomId?.toString() || roomId;

      await publishMessage(finalRoomId, {
        message: plainMessage,
        room,
        shouldUpdateLastMessage
      });

    } catch (error: any) {
      socket.emit("chat:error", {
        message: error.message || "Internal error",
      });
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

  socket.on("edit:message", async ({
    messageId,
    roomId,
    content,
  }: {
    messageId: string;
    roomId: string;
    content: string;
  }) => {
    try {
      const userId = socket.data.identity;
      if (!userId) throw new Error("Unauthorized");

      const { message, room, shouldUpdateLastMessage } = await chatService.editMessage({
        messageId,
        roomId,
        newContent: content,
        userId,
      });

      if (!message) {
        throw new Error("Edit message failed");
      }

      const plainMessage = message.toObject ? message.toObject() : message;
      const finalRoomId = plainMessage.roomId?.toString() || roomId;

      if (finalRoomId) {
        await publishMessage(finalRoomId, {
          message: plainMessage,
          room,
          shouldUpdateLastMessage
        });
      } else {
        throw new Error("Room ID is undefined");
      }

    } catch (error: any) {
      console.error("❌ edit:message error:", error);
      socket.emit("chat:error", {
        message: error.message || "Internal server error",
      });
    }
  });


  // socket.on("clear:chat", async ({ byUser, roomId }) => {

  //   console.log("id's: ", byUser, roomId);

  //   await chatService.clearChat(byUser, roomId)
  //   io.to(roomId).emit("clear:chat:success", { roomId, byUser });
  // })

  // socket.on("message:seen", async ({ userId, roomId, messageId }) => {
  //   console.log("message is reading");

  //   const seenMessages = await chatService.MessageSeenUpdate(userId, roomId, messageId);
  //   if (!seenMessages) return;
  //   console.log("message: ", JSON.parse(JSON.stringify(seenMessages)));

  //   const senderId = seenMessages?.sender?._id.toString();
  //   io.to(senderId).emit("message:seen:success", seenMessages)
  // })

  socket.on("accept:message_request", async ({ userId, roomId, createdBy }) => {
    console.log("user : ", userId, "room : ", roomId, "createdBy : ", createdBy);

    if (!userId || !roomId || !createdBy) throw new Error("fields are missing!")
    const result = await chatService.acceptMessageRequest(userId, roomId, createdBy)

    const receivers = result?.receivers
    if (receivers && result) {
    receivers.map((u)=>io.to(u?.userId.toString()).emit("accept:message_request:success", result.room))
    }
  })
};
