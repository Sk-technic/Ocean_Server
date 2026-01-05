import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { RedisHelpers } from "../utils/redisHelper";
import { socketAuth } from "./socket.auth";
import { registerChatEvents } from "../events/socket/chat.Event";
import { UserEvents } from "../events/socket/user.Event";
import { initNotificationListner } from "../events/socket/notification.Event";
import { subscribeToChannel, subscribeToGroup } from "../events/redis/chat.sub";
import { redisClient } from "../config/redis";
import { registerCallSocketHandlers } from "../events/socket/call.Events";


export const initSocket = async (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URI,
      credentials: true,
    },
  });

  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  io.use(socketAuth);
  await subscribeToChannel(io);
  await subscribeToGroup(io);
  
  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.identity;
    if (!userId) return socket.disconnect(true);
    
    socket.join(userId);

    try {
      await RedisHelpers.setUserOnline(userId, io);
      console.log(`🟢 [connected]: ${userId}`);
      registerChatEvents(io, socket, userId);
      UserEvents(io, socket);
      initNotificationListner(io, socket, userId);
      registerCallSocketHandlers(io,socket)
      socket.on("disconnect", async () => {
        await RedisHelpers.setUserOffline(userId, io);  
        const activeRoomId = await redisClient.get(`activeRoom:${userId}`);

        if (activeRoomId) {
          await redisClient.sRem(`room:users:${activeRoomId}`, userId);
          await redisClient.del(`activeRoom:${userId}`);
        }

        console.log(`🔴 [disconnected]: ${userId}`);
      });
    } catch (err) {
      console.error("❌ Socket error:", err);
    }
  });

  return io;
};

