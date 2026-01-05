import type { SFURoom } from "./sfu.types";
import { createSFURouter } from "./sfu.router";

/**
 * Create a new SFU Room
 */
export const createSFURoom = async (
  roomId: string,
  roomType: "dm" | "group"
): Promise<SFURoom> => {
  const router = await createSFURouter();

  const room: SFURoom = {
    roomId,
    roomType,
    router,
    peers: new Map(),
  };

  return room;
};

/**
 * Cleanup SFU Room
 * Called when last peer leaves
 */
export const cleanupSFURoom = (room: SFURoom) => {
  try {
    room.router.close();
  } catch {}

  room.peers.clear();
};
