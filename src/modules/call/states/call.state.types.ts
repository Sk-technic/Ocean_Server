import type {
  Router,
  WebRtcTransport,
  Producer,
  Consumer,
} from "mediasoup/node/lib/types";

/**
 * Peer state inside a call room
 * 1 user = 1 peer
 */
export interface CallPeerState {
  userId: string;

  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}

/**
 * Call Room state (DM or Group)
 * 1 room = 1 router
 */
export interface CallRoomState {
  roomId: string;
  roomType: "dm" | "group";

  router: Router;

  peers: Map<string, CallPeerState>;
}
