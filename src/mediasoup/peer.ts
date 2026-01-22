import type {
  WebRtcTransport,
  Producer,
  Consumer
} from "mediasoup/node/lib/types";

export class Peer {
  id: string;
  socketId: string;

  transports = new Map<string, WebRtcTransport>();
  producers = new Map<string, Producer>();
  
  consumers = new Map<string, Consumer>();

  constructor(socketId: string) {
    this.id = socketId;
    this.socketId = socketId;
  }

  addTransport(transport: WebRtcTransport) {
    this.transports.set(transport.id, transport);
  }

  getTransport(transportId: string) {
    return this.transports.get(transportId);
  }

  removeTransport(transportId: string) {
    this.transports.delete(transportId);
  }
}
