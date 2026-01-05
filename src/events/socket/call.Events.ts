import { Socket, Server } from "socket.io";
import { redisClient } from "../../config/redis";
import { getRoomOnlineUsers } from "../../services/user.Services";
import { RedisHelpers } from "../../utils/redisHelper";

export const registerCallSocketHandlers = (
    io: Server,
    socket: Socket
) => {
    const selfUserId = socket.data.identity;

    socket.on("call:start", async (payload) => {
        try {
            const {
                roomId,
                roomType, // "dm" | "group"
                callType,
                caller,
                receiver,
            } = payload;

            if (!roomId || !caller?.id) return;

            if (roomType === "dm") {
                if (!receiver?.id) return;

                const isBusy = await RedisHelpers.isUserBusy(receiver.id);

                if (isBusy) {
                    io.to(caller.id).emit("call:busy", {
                        roomId,
                        callType,
                        userId: receiver.id,
                        reason: "User is already on another call",
                    });
                    return;
                }

                io.to(receiver.id).emit("call:incoming", {
                    roomId,
                    callType,
                    caller,
                });

                return;
            }


            const { onlineUsers,offlineUsers } = await getRoomOnlineUsers(roomId);
            
            const allUsers = [...onlineUsers,...offlineUsers]
            
            for (const uid of allUsers) {
                if (uid === caller.id) continue;

                const isBusy = await RedisHelpers.isUserBusy(uid);
                if (isBusy) continue; // silent skip (correct for group)

                io.to(uid).emit("group:call:notify", {
                    roomId,
                    callType,
                    caller,
                });
            }
        } catch (err) {
            console.error("❌ call:start error:", err);
        }
    });

    /* =====================================
       CALL ACCEPT
    ===================================== */
    socket.on("call:accept", async ({ roomId, caller, roomType }) => {
        if (!roomId || !caller) return;

        const acceptor = socket.data.user;
        console.log('-------------user : ', socket.data)

        await RedisHelpers.markUserBusy(acceptor._id, roomId);

        await RedisHelpers.markUserBusy(caller?.id, roomId);
        if (roomType === "dm") {
            await RedisHelpers.setDMCallMeta(
                roomId,
                caller.id,
                acceptor?._id
            );
        }
        io.to(caller?.id).emit("call:accepted", {
            roomId,
            acceptedBy: {
                id: acceptor?._id,
                name: acceptor?.username,
                avatar: acceptor?.profilePic
            },
        });

        io.to(acceptor?._id).emit("call:accepted", {
            roomId,
            acceptedBy: caller,
        });
    });


    /* =====================================
       CALL END
    ===================================== */
    socket.on("call:end", async ({ roomId, roomType }) => {
        const userId = socket.data.identity;

        if (roomType !== "dm") return;

        const metaRaw = await redisClient.get(`call:dm:${roomId}`);
        if (!metaRaw) return;

        const { callerId, receiverId } = JSON.parse(metaRaw);
        setTimeout(() => {
            io.to(callerId.toString()).emit("call:ended", {
                roomId,
                endedBy: userId,
            });
            io.to(receiverId.toString()).emit("call:ended", {
                roomId,
                endedBy: userId,
            });
        }, 500);



        console.log("-----------------cal ended", callerId, receiverId);
        await RedisHelpers.clearUserBusy(callerId);
        await RedisHelpers.clearUserBusy(receiverId);




        await redisClient.del(`call:dm:${roomId}`);
    });


    socket.on("call:reject", async ({ roomId, callerId,type }) => {
        try {
            if (!roomId || !callerId ||!type) return;
            console.log("type :---------",type);
            
            if(type==="dm"){
                io.to(callerId).emit("call:rejected", {
                    roomId,
                    rejectedBy: socket.data.identity,
                });   
            }
            await RedisHelpers.clearUserBusy(
                socket.data.identity
            );
        } catch (err) {
            console.error("❌ call:reject error:", err);
        }
    });

    socket.on("call:cancel", async ({ roomId, receiverId, roomType }) => {
        try {
            console.log("daata--------: ---",roomId,receiverId,roomType);
            
            if (!roomId || !roomType) return;
            console.log("roomType :--- ",roomType);
            if(roomType==="dm" && receiverId){
                io.to(receiverId).emit("call:cancelled", {
                    roomId,
                    cancelledBy: socket.data.identity,
                });   
            }

            const { onlineUsers,offlineUsers } = await getRoomOnlineUsers(roomId);

            const allUsers = [...onlineUsers,...offlineUsers]
            console.log("all Users : --------",allUsers);
            
            for (const uid of allUsers) {
                 io.to(uid).emit("call:cancelled", {
                    roomId,
                    cancelledBy: socket.data.identity,
                });   
            }
            await RedisHelpers.clearUserBusy(
                socket.data.identity
            );
        } catch (err) {
            console.error("❌ call:cancel error:", err);
        }
    });


    /* =====================================
       DISCONNECT SAFETY
    ===================================== */
    socket.on("disconnect", async () => {
        await RedisHelpers.clearUserBusy(
            socket.data.identity
        );
    });
};
