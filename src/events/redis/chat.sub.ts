import { redisClient } from "../../config/redis";

let subscriberClient: any = null;
const subscribedRooms = new Set<string>();

export const subscribeToChannel = async <T = any>(
  channel: string,
  callback: (message: T) => void
) => {
  try {
    if (!subscriberClient) {
      subscriberClient = redisClient.duplicate();
      await subscriberClient.connect();
    }

    if (subscribedRooms.has(channel)) return;

    await subscriberClient.subscribe(channel, (rawMessage: string) => {
      console.log(`[Redis:SUB] Message on ${channel}:`);
      try {
        const parsed: T = JSON.parse(rawMessage);
        callback(parsed);
      } catch (err) {
        // console.error(`[Redis:SUB] Parse error on ${channel}:`, err);
      }
    });

    subscribedRooms.add(channel);
    // console.log(`[Redis:SUB] Subscribed to channel: ${channel}`);
  } catch (err) {
    console.error(`[Redis:SUB] Failed to subscribe to ${channel}`, err);
  }
};


