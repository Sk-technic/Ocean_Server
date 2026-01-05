import type {
  Router,
  WebRtcTransport,
  Producer,
  Consumer,
} from "mediasoup/node/lib/types";

/**
 * Transport maps
 */
export type TransportMap = Map<string, WebRtcTransport>;
export type ProducerMap = Map<string, Producer>;
export type ConsumerMap = Map<string, Consumer>;

/**
 * SFU Peer
 * 1 peer = 1 user in call room
 */
export interface SFUPeer {
  userId: string;

  transports: TransportMap;
  producers: ProducerMap;
  consumers: ConsumerMap;
}

/**
 * SFU Room
 * 1 room = 1 router
 */
export interface SFURoom {
  roomId: string;
  roomType: "dm" | "group";

  router: Router;
  peers: Map<string, SFUPeer>;
}
