import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { RedisHelpers } from "../utils/redisHelper";
import { socketAuth } from "./socket.auth";
import { registerChatEvents } from "../events/socket/chat.Event";
import { UserEvents } from "../events/socket/user.Event";
import { initNotificationListner } from "../events/socket/notification.Event";

export const initSocket = async (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URI,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  io.use(socketAuth);

  io.on("connection", async (socket: Socket) => {
    const userId = socket.data.identity;
    if (!userId) return socket.disconnect(true);
      socket.join(userId);

    try {
      socket.join(userId);
      await RedisHelpers.setUserOnline(userId, io);
      await RedisHelpers.set(`user:socket:${userId}`, socket.id, 120);
      console.log(`🟢 [connected]: ${userId}`);

      registerChatEvents(io, socket, userId);
      UserEvents(io, socket);
      initNotificationListner(io,socket,userId);

      socket.on("user:heartbeat", async () => {
        await RedisHelpers.refreshUserPresence(userId);
      });

      socket.on("disconnect", async () => {
        try {
          await RedisHelpers.setUserOffline(userId, io);
          await RedisHelpers.del(`user:socket:${userId}`);
          console.log(`🔴 [disconnected]: ${userId}`);
        } catch (err) {
          console.error(`❌ Disconnect error for ${userId}:`, err);
        }
      });
    } catch (err) {
      console.error("❌ Socket error:", err);
    }
  });

  console.log("🚀 Socket.IO initialized with Redis adapter and presence tracking");
  return io;
};
