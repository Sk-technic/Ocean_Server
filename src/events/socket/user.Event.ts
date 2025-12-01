import { Server, Socket } from "socket.io";
import { RedisHelpers } from "../../utils/redisHelper";

export const UserEvents = (io: Server, socket: Socket) => {
  const userId = socket.data.identity || socket.data.userId;

  socket.on("user:get_online_users", async (userIds: string[], callback) => {
    try {

      if (!Array.isArray(userIds) || userIds.length === 0) {
        callback([]);
        return;
      }

      const onlineStatuses = await RedisHelpers.getUsersOnlineStatus(userIds);

      callback(onlineStatuses);
    } catch (err) {
      console.error("❌ [user:get_online_users] Error:", err);
      callback([]);
    }
  });

  socket.onAny((event, ...args) => {
    if (!event.startsWith("user:heartbeat")) {
      console.log(`📡 [UserEvents] Event received -> ${event}`, args?.[0]);
    }
  });
};
