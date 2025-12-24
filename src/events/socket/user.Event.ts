import { Server, Socket } from "socket.io";
import { RedisHelpers } from "../../utils/redisHelper";

export const UserEvents = (io: Server, socket: Socket) => {
  const userId = socket.data.identity || socket.data.userId;

 socket.on("user:get_online_users", async (userIds, callback) => {
  console.log("📡 user:get_online_users", userIds);

  const onlineStatuses = await RedisHelpers.getUsersOnlineStatus(userIds);
  callback(onlineStatuses);
});

};
