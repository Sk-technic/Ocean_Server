import { userService } from "../services";
import { redisClient } from "../config/redis";
import type { Server } from "socket.io";

function safeParse<T>(data: string | null): T | null {
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export const TTL = {
  USER: 60 * 60 * 2, // 2 hours
  MESSAGE: 60 * 5,
  CHAT_LIST: 60 * 2,
};

export const RedisHelpers = {
  /** 🧠 USER AUTH CACHE */
  async setUser(userId: string, userData: any, ttlSeconds = TTL.USER) {
    const key = `cached:user:${userId}`;
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(userData));
  },

  async getUser(userId: string) {
    const key = `cached:user:${userId}`;
    return safeParse(await redisClient.get(key));
  },

  /** ⚡ USER PRESENCE MANAGEMENT */
  async setUserOnline(userId: string, io: Server) {
    const key = `user:presence:${userId}`;
    const now = Date.now().toString();

    await redisClient
      .multi()
      .hSet(key, { status: "online", lastActive: now })
      .expire(key, 7200) // 2 hours TTL
      .exec();

    await userService.updateLastActive(userId, true)

    io.emit("user:status:update", { userId, status: "online", lastActive: null });
    console.log(`🟢 User online -> ${userId}`);
  },

  async setUserOffline(userId: string, io: Server) {
    const key = `user:presence:${userId}`;
    const now = Date.now().toString();

    await redisClient
      .multi()
      .hSet(key, { status: "offline", lastActive: now })
      .expire(key, 7200)
      .exec();
    await userService.updateLastActive(userId, false)

    io.emit("user:status:update", {
      userId,
      status: "offline",
      lastActive: Number(now),
    });

    console.log(`🔴 User offline -> ${userId}`);
  },

  async refreshUserPresence(userId: string) {
    const key = `user:presence:${userId}`;
    const now = Date.now().toString();

    await redisClient
      .multi()
      .hSet(key, { status: "online", lastActive: now })
      .expire(key, 7200) // refresh TTL
      .exec();

    console.log(`♻️ Refreshed presence TTL for user: ${userId}`);
  },

  async getUsersOnlineStatus(userIds: string[]) {
    if (!userIds?.length) return [];

    const pipeline = redisClient.multi();
    userIds.forEach((id) => pipeline.hGetAll(`user:presence:${id}`));

    const results = (await pipeline.exec()) as unknown as Record<string, string>[];

    return userIds.map((id, i) => ({
      userId: id,
      isOnline: results[i]?.status === "online",
      lastActive: results[i]?.lastActive ? Number(results[i].lastActive) : null,
    }));
  },

  async isUserOnline(userId: string) {
    const status = await redisClient.hGet(`user:presence:${userId}`, "status");
    return status === "online";
  },

  async getUserLastActive(userId: string) {
    const last = await redisClient.hGet(`user:presence:${userId}`, "lastActive");
    return last ? new Date(Number(last)) : null;
  },

  async getSocketId(userId: string) {
    return await redisClient.get(`user:socket:${userId}`);
  },

  async addUserToRoom(roomId: string, userId: string) {
    await redisClient.sAdd(`room:users:${roomId}`, userId);
  },

  async removeUserFromRoom(roomId: string, userId: string) {
    await redisClient.sRem(`room:users:${roomId}`, userId);
  },

  async getRoomUsers(roomId: string) {
    return await redisClient.sMembers(`room:users:${roomId}`);
  },

  async setUserTyping(roomId: string, user: { id: string; name: string }) {
    const key = `user:typing:${roomId}`;

    // Store as a hash: field = user.id, value = user.name
    const res = await redisClient.hSet(key, user.id, user.name);
    console.log("🔹 Redis hSet result:", res);

    // Expire after 5 seconds (auto clears if no activity)
    await redisClient.expire(key, 1);
  },

  async removeUserTyping(roomId: string, userId: string) {
    const key = `user:typing:${roomId}`;
    const res = await redisClient.hDel(key, userId);
    console.log("🧹 Redis hDel result:", res);
  },

  async getTypingUsers(roomId: string) {
    const key = `user:typing:${roomId}`;
    const users = await redisClient.hGetAll(key);
    console.log("📦 Raw Redis hGetAll:", users);
    // Convert Redis object into array of {id, name}
    return Object.entries(users).map(([id, name]) => ({ id, name }));
  },

  async incrementUnread(userId: string, roomId: string) {
    await redisClient.incr(`unread:${userId}:${roomId}`);
  },

  async clearUnread(userId: string, roomId: string) {
    await redisClient.del(`unread:${userId}:${roomId}`);
  },

  async getUnreadCount(userId: string, roomId: string) {
    const val = await redisClient.get(`unread:${userId}:${roomId}`);
    return val ? parseInt(val) : 0;
  },

  async cacheMessage(messageId: string, messageData: any) {
    await redisClient.setEx(
      `message:pending:${messageId}`,
      TTL.MESSAGE,
      JSON.stringify(messageData)
    );
  },

  async getCachedMessage(messageId: string) {
    return safeParse(await redisClient.get(`message:pending:${messageId}`));
  },

  async incrementUserRate(userId: string) {
    const key = `rate:limit:${userId}`;
    const count = await redisClient.incr(key);
    if (count === 1) await redisClient.expire(key, 60);
    return count;
  },

  async get<T>(key: string): Promise<T | null> {
    return safeParse(await redisClient.get(key));
  },

  async set(key: string, value: any, ttlSeconds?: number) {
    const str = JSON.stringify(value);
    if (ttlSeconds) await redisClient.setEx(key, ttlSeconds, str);
    else await redisClient.set(key, str);
  },

  async del(key: string) {
    await redisClient.del(key);
  },

  async delPattern(pattern: string) {
    const keys = await redisClient.keys(pattern);
    if (keys.length) await redisClient.del(keys);
  },
};
