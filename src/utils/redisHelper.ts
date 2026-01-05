import { userService } from "../services";
import { redisClient } from "../config/redis";
import type { Server } from "socket.io";
import crypto from "crypto";
import { CryptoUtil } from "./crypto";
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



  async setUser(userId: string, userData: any, ttlSeconds = TTL.USER) {
    const key = `cached:user:${userId}`;
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(userData));
  },

  async getUser(userId: string) {
    const key = `cached:user:${userId}`;
    return safeParse(await redisClient.get(key));
  },

  async setUserOnline(userId: string, io: Server) {
    const countKey = `presence:count:${userId}`;
    const presenceKey = `user:presence:${userId}`;

    let count = await redisClient.incr(countKey);

    // 🔴 SAFETY: Redis restart / stale state
    if (count === 1) {
      const now = Date.now().toString();

      await redisClient.hSet(presenceKey, {
        status: "online",
        lastActive: now,
      });

      await userService.updateLastActive(userId, true);

      io.emit("user:status:update", {
        userId,
        status: "online",
        lastActive: now,
      });

      console.log(`🟢 User online -> ${userId}`);
    }
  },



  async setUserOffline(userId: string, io: Server) {
    const countKey = `presence:count:${userId}`;
    const presenceKey = `user:presence:${userId}`;

    let count = await redisClient.decr(countKey);

    // 🔴 SAFETY: handle negative / invalid count
    if (count <= 0) {
      await redisClient.del(countKey);

      const now = Date.now().toString();

      await redisClient.hSet(presenceKey, {
        status: "offline",
        lastActive: now,
      });

      const presence = await userService.updateLastActive(userId, false);

      io.emit("user:status:update", {
        userId,
        status: "offline",
        lastActive: presence?.lastActive ?? Number(now),
      });

      console.log(`🔴 User offline -> ${userId}`);
      return;
    }

    // still has active sockets
    console.log(
      `⚠️ User ${userId} still online on ${count} sockets`
    );
  },


  async isUserBusy(userId: string) {
    return Boolean(await redisClient.get(`call:active:${userId}`));
  },

  async markUserBusy(userId: string, roomId: string) {
    const key = `call:active:${userId}`;

    const result = await redisClient.set(
      key,
      roomId,
      { NX: true, EX: 3600 }
    );

    return result === "OK";
  },

  async setDMCallMeta(
    roomId: string,
    callerId: string,
    receiverId: string
  ): Promise<void> {
    await redisClient.set(
      `call:dm:${roomId}`,
      JSON.stringify({
        callerId,
        receiverId,
      }),
      {
        EX: 60 * 60, // auto cleanup
      }
    );
  },

 async getDMCallMeta(
    roomId: string
  ): Promise<{
    callerId: string;
    receiverId: string;
  } | null> {
    const raw = await redisClient.get(`call:dm:${roomId}`);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async clearUserBusy(userId: string) {
    await redisClient.del(`call:active:${userId}`);
  },



  // async refreshUserPresence(userId: string) {
  //   const key = `user:presence:${userId}`;

  //   await redisClient
  //     .multi()
  //     .hSet(key, { status: "online" })
  //     .expire(key, 7200)
  //     .exec();
  // },

  async getUsersOnlineStatus(userIds: string[]) {
    if (!userIds?.length) return [];

    const pipeline = redisClient.multi();
    userIds.forEach((id) => pipeline.hGetAll(`user:presence:${id}`));

    const results = (await pipeline.exec()) as unknown as Record<string, string>[];

    return userIds.map((id, i) => ({
      userId: id,
      isOnline: results[i]?.status === "online",
      lastActive: results[i]?.status === "offline" && results[i]?.lastActive
        ? Number(results[i].lastActive)
        : null,
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
    const prevRoomId = await redisClient.get(`activeRoom:${userId}`);
    if (prevRoomId && prevRoomId !== roomId) {
      await redisClient.sRem(`room:users:${prevRoomId}`, userId);
    }
    await redisClient.set(`activeRoom:${userId}`, roomId);
    await redisClient.sAdd(`room:users:${roomId}`, userId);
  },

  async removeUserFromRoom(roomId: string, userId: string) {
    const activeRoomId = await redisClient.get(`activeRoom:${userId}`);
    if (activeRoomId === roomId) {
      await redisClient.sRem(`room:users:${roomId}`, userId);
      await redisClient.del(`activeRoom:${userId}`);
    }
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

  async setOtp(email: string, otp: string, expiryInSec: number = 50) {
    const key = `otp:${email}`;

    const salt = crypto.randomBytes(16).toString("hex");
    const hashed = crypto
      .createHmac("sha256", salt)
      .update(otp)
      .digest("hex");

    const encryptedData = CryptoUtil.encrypt(
      JSON.stringify({ hashed, salt })
    );

    // ⏳ Dynamic expiry (default fallback = 50 seconds)
    await redisClient.setEx(key, expiryInSec, encryptedData);

    return true;
  },


  async getOtp(email: string) {
    const key = `otp:${email}`;
    const encrypted = await redisClient.get(key);
    if (!encrypted) return null;

    const decrypted = CryptoUtil.decrypt(encrypted);

    return safeParse<{ hashed: string; salt: string }>(decrypted);
  },

  async verifyOtp({ email, submittedOtp }: { email: string, submittedOtp: string }) {
    const key = `otp:${email}`;
    const encrypted = await redisClient.get(key);
    if (!encrypted) return false;
    const stored = safeParse<{ hashed: string; salt: string }>(
      CryptoUtil.decrypt(encrypted)
    );

    if (!stored) return false;

    const submittedHash = crypto
      .createHmac("sha256", stored.salt)
      .update(submittedOtp)
      .digest("hex");

    if (submittedHash !== stored.hashed) return false;

    await redisClient.del(key);
    return true;
  },

  async deleteOtp(email: string) {
    await redisClient.del(`otp:${email}`);
  },
};
