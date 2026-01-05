import { CallRoomState, CallPeerState } from "./call.state.types";

/**
 * Get peer from a room
 */
export const getPeerFromRoom = (
  room: CallRoomState,
  userId: string
) => {
  return room.peers.get(userId) || null;
};

/**
 * Add peer to room
 */
export const addPeerToRoom = (
  room: CallRoomState,
  peer: CallPeerState
) => {
  room.peers.set(peer.userId, peer);
};

/**
 * Remove peer from room
 */
export const removePeerFromRoom = (
  room: CallRoomState,
  userId: string
) => {
  room.peers.delete(userId);
};

/**
 * Check if peer exists in room
 */
export const hasPeerInRoom = (
  room: CallRoomState,
  userId: string
) => {
  return room.peers.has(userId);
};

/**
 * Get all peers in room
 */
export const getAllPeersInRoom = (
  room: CallRoomState
) => {
  return room.peers;
};
