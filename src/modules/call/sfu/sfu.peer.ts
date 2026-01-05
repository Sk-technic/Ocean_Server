import type {
  WebRtcTransport,
  Producer,
  Consumer,
} from "mediasoup/node/lib/types";
import type { SFUPeer } from "./sfu.types";

/**
 * Create a new SFU Peer for a user
 */
export const createSFUPeer = (userId: string): SFUPeer => {
  return {
    userId,
    transports: new Map<string, WebRtcTransport>(),
    producers: new Map<string, Producer>(),
    consumers: new Map<string, Consumer>(),
  };
};

/**
 * Cleanup SFU Peer resources
 * Order is IMPORTANT:
 * consumers -> producers -> transports
 */
export const cleanupSFUPeer = (peer: SFUPeer) => {
  // Close consumers
  peer.consumers.forEach((consumer) => {
    try {
      consumer.close();
    } catch {}
  });
  peer.consumers.clear();

  // Close producers
  peer.producers.forEach((producer) => {
    try {
      producer.close();
    } catch {}
  });
  peer.producers.clear();

  // Close transports
  peer.transports.forEach((transport) => {
    try {
      transport.close();
    } catch {}
  });
  peer.transports.clear();
};
