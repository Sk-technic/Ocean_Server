import { JwtPayload, verify, Secret } from "jsonwebtoken";
import { Collections } from "../models";
import type { Socket } from "socket.io";
import { RedisHelpers } from "../utils/redisHelper";

export const socketAuth = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    // If socket already has data (in case of reconnect)
    if (socket.data?.user && socket.data?.identity) {
      console.log(`♻️ [socketAuth] Reconnection by: ${socket.data.user.username}`);
      return next();
    }

    // Try cached auth from Redis (cross-instance)
    const cachedUserId = socket.handshake.auth?.userId;
    if (cachedUserId) {
      const cachedUser = await (RedisHelpers as any).getUser(cachedUserId); // get cached user JSON
      if (cachedUser) {
        socket.data.identity = cachedUser._id.toString();
        socket.data.user = cachedUser;
        console.log(`♻️ [socketAuth] Authenticated from Redis cache: ${cachedUser.username}`);
        return next();
      }
    }

    const authHeader = socket.handshake.headers?.authorization || "";
    const tokenFromHeader = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
    const token: string | null = socket.handshake.auth?.token || tokenFromHeader || null;

    if (!token) throw new Error("Unauthorized: No token provided");

    const secret = process.env.JWT_ACCESS_SECRET as Secret;
    if (!secret) throw new Error("JWT_ACCESS_SECRET not defined");

    const payload = verify(token, secret) as JwtPayload & { _id: string };
    if (!payload?._id) throw new Error("Invalid token payload");

    const user = await Collections.UserModel.findById(payload._id)
      .select("email username fullName profilePic")
      .lean()
      .exec();

    if (!user) throw new Error("Unauthorized: User not found");

    // Cache user in Redis for future reconnections
    await (RedisHelpers as any).setUser(payload._id, user, 60 * 60 * 2); // 2 hrs cache TTL

    socket.data.identity = payload._id;
    socket.data.user = user;

    console.log(`✅ [socketAuth] Authenticated: ${user.username} (${socket.id})`);
    next();
  } catch (error: any) {
    console.error("❌ [socketAuth] Authentication error:", error.message);
    next(new Error("Unauthorized: " + error.message));
  }
};
