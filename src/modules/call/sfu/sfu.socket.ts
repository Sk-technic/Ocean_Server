import { Server, Socket } from "socket.io";

import { createSFURoom } from "./sfu.room";
import { createSFUPeer } from "./sfu.peer";

import {
  getCallRoom,
  addCallRoom,
} from "../states/call.room.state";

import {
  hasPeerInRoom,
  addPeerToRoom,
} from "../states/call.peers.state";
import { createWebRtcTransport } from "./sfu.transport";
import { getPeerFromRoom } from "../states/call.peers.state";
import { createSFUProducer } from "./sfu.producer";

/**
 * Register SFU socket handlers
 */
export const registerSFUSocketHandlers = (
  io: Server,
  socket: Socket
) => {
  const userId = socket.data.identity;

  /**
   * SFU JOIN
   * Called after call is accepted
   */
  socket.on(
    "sfu:join",
    async ({
      roomId,
      roomType,
    }: {
      roomId: string;
      roomType: "dm" | "group";
    }) => {
      if (!roomId || !userId) return;

      // 1️⃣ Get or create room
      let room = getCallRoom(roomId);

      if (!room) {
        room = await createSFURoom(roomId, roomType);
        addCallRoom(room);
      }

      // 2️⃣ Create peer if not exists
      const peerExists = hasPeerInRoom(room, userId);

      if (!peerExists) {
        const peer = createSFUPeer(userId);
        addPeerToRoom(room, peer);
      }

      // 3️⃣ Send RTP capabilities to client
      socket.emit("sfu:routerRtpCapabilities", {
        rtpCapabilities: room.router.rtpCapabilities,
      });
    }
  );




  socket.on(
  "sfu:createTransport",
  async ({
    roomId,
    direction, // "send" | "recv"
  }: {
    roomId: string;
    direction: "send" | "recv";
  }) => {
    if (!roomId || !userId) return;

    const room = getCallRoom(roomId);
    if (!room) return;

    const peer = getPeerFromRoom(room, userId);
    if (!peer) return;

    const transport = await createWebRtcTransport(room.router);

    peer.transports.set(transport.id, transport);

    socket.emit("sfu:transportCreated", {
      id: transport.id,
      direction,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    });
  }
);



socket.on(
  "sfu:connectTransport",
  async ({
    roomId,
    transportId,
    dtlsParameters,
  }: {
    roomId: string;
    transportId: string;
    dtlsParameters: any;
  }) => {
    if (!roomId || !userId) return;

    const room = getCallRoom(roomId);
    if (!room) return;

    const peer = getPeerFromRoom(room, userId);
    if (!peer) return;

    const transport = peer.transports.get(transportId);
    if (!transport) return;

    await transport.connect({ dtlsParameters });
  }
);


socket.on(
  "sfu:produce",
  async ({
    roomId,
    transportId,
    kind,
    rtpParameters,
  }: {
    roomId: string;
    transportId: string;
    kind: "audio" | "video";
    rtpParameters: any;
  }) => {
    if (!roomId || !userId) return;

    const room = getCallRoom(roomId);
    if (!room) return;

    const peer = getPeerFromRoom(room, userId);
    if (!peer) return;

    const transport = peer.transports.get(transportId);
    if (!transport) return;

    // 1️⃣ Create producer
    const producer = await createSFUProducer(
      transport,
      kind,
      rtpParameters,
      {
        userId,
        roomId,
      }
    );

    // 2️⃣ Store producer
    peer.producers.set(producer.id, producer);

    // 3️⃣ Inform client
    socket.emit("sfu:produced", {
      producerId: producer.id,
    });

    // 4️⃣ Notify others (for STEP 4 consume)
    socket.to(roomId).emit("sfu:newProducer", {
      producerId: producer.id,
      userId,
      kind,
    });
  }
);


};
