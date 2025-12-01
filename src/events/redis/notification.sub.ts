import { redisClient } from "../../config/redis";

let subscriberClient: any = null;
const subscribedRooms = new Set<string>();

export const notificationSubscribe = async <T = any>(
  channel: string,
  callback: (notification: T) => void
) => {
  try {
    if (!subscriberClient) {
      subscriberClient = redisClient.duplicate();
      await subscriberClient.connect();
    }

    if (subscribedRooms.has(channel)) return;

    await subscriberClient.subscribe(channel, (rawNotification: string) => {
      console.log(`[Redis:SUB] Message on ${channel}:`);
      try {
        const parsed: T = JSON.parse(rawNotification);
        callback(parsed);
      } catch (err:any) {
        //   console.error(`[Redis:SUB] Parse error on ${channel}:`, err);
        throw new Error(err?.message)
      }
    });

    subscribedRooms.add(channel);
    // console.log(`[Redis:SUB] Subscribed to channel: ${channel}`);
  } catch (err) {
    console.error(`[Redis:SUB] Failed to subscribe to ${channel}`, err);
  }
};


