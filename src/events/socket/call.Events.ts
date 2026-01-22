import { Socket, Server } from "socket.io";
import { redisClient } from "../../config/redis";
import { getRoomOnlineUsers } from "../../services/user.Services";
import { RedisHelpers } from "../../utils/redisHelper";
import { getOrCreateRoom } from "../../mediasoup/roomManager";
import { createWebRtcTransport } from "../../mediasoup/transport";
import { Peer } from "../../mediasoup/peer";
import { Room } from "mediasoup/room";
import { Router } from "mediasoup/node/lib/RouterTypes";
type ActiveRoom = Room & { router: Router };

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


            const { onlineUsers, offlineUsers } = await getRoomOnlineUsers(roomId);

            const allUsers = [...onlineUsers, ...offlineUsers]

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
    socket.on("call:accept", async ({ roomId, caller, roomType, callType }) => {
        if (!roomId || !caller) return;

        const acceptor = socket.data.user;
        console.log('-------------user : ', socket.data)

        await RedisHelpers.markUserBusy(acceptor._id, roomId);

        await RedisHelpers.markUserBusy(caller?.id, roomId);
        if (roomType === "dm") {
            await RedisHelpers.setDMCallMeta(
                roomId,
                caller.id,
                acceptor?._id,
            );
        }
        io.to(caller?.id).emit("call:accepted", {
            roomId,
            acceptedBy: {
                id: acceptor?._id,
                name: acceptor?.username,
                avatar: acceptor?.profilePic
            },
            type: callType
        });

        io.to(acceptor?._id).emit("call:accepted", {
            roomId,
            acceptedBy: caller,
            type: callType
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


    socket.on("call:reject", async ({ roomId, callerId, type }) => {
        try {
            if (!roomId || !callerId || !type) return;
            console.log("type :---------", type);

            if (type === "dm") {
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
            console.log("daata--------: ---", roomId, receiverId, roomType);

            if (!roomId || !roomType) return;
            console.log("roomType :--- ", roomType);
            if (roomType === "dm" && receiverId) {
                io.to(receiverId).emit("call:cancelled", {
                    roomId,
                    cancelledBy: socket.data.identity,
                });
            }

            const { onlineUsers, offlineUsers } = await getRoomOnlineUsers(roomId);

            const allUsers = [...onlineUsers, ...offlineUsers]
            console.log("all Users : --------", allUsers);

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



    //webrtc-tunnel

    socket.on("rtc:join-room", async ({ roomId }) => {
        const room = await getOrCreateRoom(roomId);

        socket.join(roomId);

        socket.emit("rtc:router-capabilities", room?.router?.rtpCapabilities);

        console.log(`👤 ${socket.id} joined room ${roomId}`);
    });


    socket.on("rtc:create-transport", async ({ roomId, direction }, callback) => {
        const room = await getOrCreateRoom(roomId);

        let peer = room.peers.get(socket.id);
        if (!peer) {
            peer = new Peer(socket.id);
            room.peers.set(socket.id, peer);
        }

        if (room?.router) {
            const transport = await createWebRtcTransport(room.router);
            transport.appData = {
                direction,        // "send" | "recv"
                peerId: socket.id
            };
            peer.addTransport(transport);

            transport.on("dtlsstatechange", (state) => {
                if (state === "closed") transport.close();
            });

            callback({
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters
            });
        }
    });

    socket.on(
        "rtc:connect-transport",
        async ({ roomId, transportId, dtlsParameters }) => {
            const room = await getOrCreateRoom(roomId);
            const peer = room.peers.get(socket.id);
            if (!peer) return;

            const transport = peer.getTransport(transportId);
            if (!transport) return;

            await transport.connect({ dtlsParameters });

            console.log("🔗 Transport connected:", transportId);
        }
    );

    socket.on(
        "rtc:produce",
        async ({ roomId, transportId, kind, rtpParameters }, callback) => {
            const room = await getOrCreateRoom(roomId);
            const peer = room.peers.get(socket.id);
            if (!peer) return;

            const transport = peer.getTransport(transportId);
            if (!transport) return;

            const producer = await transport.produce({
                kind,
                rtpParameters,
                pause: false,
                appData: {
                    peerId: peer.userId
                }
            });

            if (producer.kind === "video") {
                await producer.resume();
                console.log("🎥 Video producer resumed:", producer.id);
            }
            peer.producers.set(producer.id, producer);

            socket.to(roomId).emit("rtc:new-producer", {
                producerId: producer.id,
                peerId: socket.id,
                kind
            });

            console.log("📢 rtc:new-producer emitted:", producer.id, kind);

            callback({ producerId: producer.id });

            console.log("🎙️ Producer created:", kind, producer.id);
        }
    );

    // backend/socket/call.socket.ts
    socket.on(
        "rtc:consume",
        async ({ roomId, producerId, rtpCapabilities }, callback) => {
            const room = await getOrCreateRoom(roomId) as ActiveRoom;

            const peer = room.peers.get(socket.id);

            if (!peer) return;

            if (!room.router.canConsume({ producerId, rtpCapabilities })) {
                console.error("❌ cannot consume", producerId);
                return;
            }
            const producerPeer = [...room.peers.values()].find(p => p.producers.has(producerId));

            if (!producerPeer) {
                console.error("❌ producer owner peer not found", producerId);
                return;
            }
            const recvTransport = [...peer.transports.values()].find(t => t.appData?.direction === "recv");
            if (!recvTransport) {
                console.error("❌ recvTransport not found for peer", socket.id);
                return;
            }
            const consumer = await recvTransport.consume({
                producerId,
                rtpCapabilities,
                paused: false
            });



            peer.consumers.set(consumer.id, consumer);

            callback({
                id: consumer.id,
                producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
                peerId: producerPeer.id
            });

            console.log("🎧 Consumer created:", consumer.id);
        }
    );
    socket.on(
        "rtc:request-keyframe",
        async ({ consumerId }: { consumerId: string }) => {
            const room = await getOrCreateRoom(socket.data.roomId);
            if (!room) return;

            const peer = room.peers.get(socket.id);
            if (!peer) return;

            const consumer = peer.consumers.get(consumerId);

            if (!consumer) {
                console.warn("❌ Consumer not found for keyframe:", consumerId);
                return;
            }

            await consumer.requestKeyFrame();
            console.log("🔑 Keyframe requested for consumer:", consumerId);
        }
    );



















































    /* =====================================
       DISCONNECT SAFETY
    ===================================== */
    socket.on("disconnect", async () => {
        await RedisHelpers.clearUserBusy(
            socket.data.identity
        );
    });
};
