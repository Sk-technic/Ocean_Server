import { redisClient } from "../../config/redis";

let subscriber: any;
export const subscribeToChannel = async (io: any) => {
  subscriber = redisClient.duplicate();
  await subscriber.connect();

  await subscriber.pSubscribe("room:*", (message: string) => {
    const data = JSON.parse(message);
    console.log(data);

    const roomId = data?.roomId?.toString() || data?.message?.roomId?.toString();

    console.log("[REDIS SUB]", data);


    //ack
    if (data?.senderSocketId && data?.message && data?.tempId) {
      io.to(data.senderSocketId).emit("message:sent", {
        ...data.message,
        tempId: data.tempId,
      });
    }




    //edit flow
    if (data?.message?.isEdited) {
      const targetRoomId = roomId || data.message.roomId?.toString();
      io.to(targetRoomId).emit("message:edited", {
        message: data.message,
      });
    }


      // if (data.updateRoom) {
      //   if (data.room?.type === "dm" && data.receivers) {
      //     data.receivers.forEach((userId: string) => {
      //       io.to(userId.toString()).emit("room:update", data);
      //     });
      //   } else {
      //     io.to(targetRoomId).emit("room:update", data);
      //   }
      // }
      // if (data.room?.type === "dm" && data.receivers) {
      //   data.receivers.forEach((userId: string) => {
      //     io.to(userId.toString()).emit("message:edited", {
      //       message: data.message,
      //     });
      //   });
      // }
      // return;


    //join room in new dm    
    if (data?.room?.type === "dm" && data?.senderSocketId) {
      io.to(data.senderSocketId).socketsJoin(data.room._id.toString());
    }


    // //edit room
    //     if (data?.message && !data?.message?.isEdited) {
    //       io.to(roomId).emit("chat:new_message", data);

    //       if (data.receivers) {
    //         data.receivers.forEach((userId: string) => {
    //           io.to(userId.toString()).emit("chat:new_message", data);
    //         });
    //       }
    //     }

    if (data?.message || data.room) {
      io.to(roomId).emit("chat:new_message", data);
    }

    if (data?.room) {
      if (data.receivers && data.room.type == "dm") {
        data.receivers.forEach((userId: string) => {
          io.to(userId.toString()).emit("room:update", data);
        });
      } else {
        io.to(roomId).emit("room:update", data);
      }
      return
    }

    if(data.toUserId){
      io.to(data.toUserId.toString()).emit("room:update",data)
    }
  });
};