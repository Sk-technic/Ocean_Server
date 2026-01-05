import { redisClient } from "../../config/redis";

/**
 * Publish a message to a Redis channel
 * @param channel - Redis channel (e.g., room ID)
 * @param message - Any serializable data
 */
export const publishMessage = async <T = any>(
  channel: string,
  message: T
): Promise<void> => {
  try {
    // Ensure Redis is connected
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    const payload = JSON.stringify(message);
    const result = await redisClient.publish(`room:${channel}`, payload);

    // Optional: log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Redis:PUBLISH] ${channel} →`, message);
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


export const publishGroup = async <T = any>(
  channel: string,
  Group: T
): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    const payload = JSON.stringify(Group);
    const result = await redisClient.publish(`${channel}`, payload);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Redis:PUBLISH] ${channel} →`, Group);
    }


    if (result === 0) {
      console.warn(`[Redis] No subscribers for channel: ${channel}`);
    }
  } catch (error) {
    console.error(`[Redis:PUBLISH ERROR] Channel: ${channel}`, error);
    throw error;
  }
};