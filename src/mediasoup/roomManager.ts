import { Room } from "./room";

const rooms = new Map<string, Room>();

export const getOrCreateRoom = async (roomId: string) => {
  let room = rooms.get(roomId);

    if (!room) {
    room = new Room(roomId);
    rooms.set(roomId, room); 
}

await room.init();       

  return room;
};

export const removeRoom = (roomId: string) => {
  rooms.delete(roomId);
};
