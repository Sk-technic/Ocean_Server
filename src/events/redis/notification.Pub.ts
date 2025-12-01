import { redisClient } from "../../config/redis";

/**
 * Publish a message to a Redis channel
 * @param channel - Redis channel (e.g., room ID)
 * @param notification - Any serializable data
 */
export const publishNotification = async <T = any>(
  channel: string,
  notification: T
): Promise<void> => {
  try {
    // Ensure Redis is connected
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    const payload = JSON.stringify(notification);
    const result = await redisClient.publish(channel, payload);

    // Optional: log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Redis:PUBLISH] ${channel} →`, notification);
    }

    // `publish` returns number of clients that received the message
    // You can log or monitor it
    if (result === 0) {
      console.warn(`[Redis] No subscribers for channel: ${channel}`);
    }
  } catch (error) {
    console.error(`[Redis:PUBLISH ERROR] Channel: ${channel}`, error);
    throw error; // Let caller handle retry/fallback
  }
};