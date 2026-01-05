import { CallRoomState } from "./call.state.types";

/**
 * In-memory store for active call rooms
 * roomId -> CallRoomState
 */
const rooms = new Map<string, CallRoomState>();

/**
 * Get room by roomId
 */
export const getCallRoom = (roomId: string) => {
  return rooms.get(roomId) || null;
};

/**
 * Add a new call room
 */
export const addCallRoom = (room: CallRoomState) => {
  rooms.set(room.roomId, room);
};

/**
 * Remove call room
 */
export const removeCallRoom = (roomId: string) => {
  rooms.delete(roomId);
};

/**
 * Check if room exists
 */
export const hasCallRoom = (roomId: string) => {
  return rooms.has(roomId);
};

/**
 * Get all active rooms (debug / monitoring)
 */
export const getAllCallRooms = () => {
  return rooms;
};
