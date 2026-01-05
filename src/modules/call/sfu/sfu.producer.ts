import type {
  WebRtcTransport,
  Producer,
  RtpParameters,
} from "mediasoup/node/lib/types";

/**
 * Create a mediasoup Producer
 * 1 track = 1 producer
 */
export const createSFUProducer = async (
  transport: WebRtcTransport,
  kind: "audio" | "video",
  rtpParameters: RtpParameters,
  appData: Record<string, any>
): Promise<Producer> => {
  const producer = await transport.produce({
    kind,
    rtpParameters,
    appData,
  });

  return producer;
};

/**
 * Cleanup producer safely
 */
export const closeSFUProducer = (producer: Producer) => {
  try {
    producer.close();
  } catch {}
};
