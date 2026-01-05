import type { Server, Socket } from "socket.io";
import { initSFUWorker } from "./sfu/sfu.worker";
import { registerSFUSocketHandlers } from "./sfu/sfu.socket";

/**
 * Initialize Call Module
 * Called once on server startup
 */
export const initCallModule = async () => {
  await initSFUWorker();
  console.log("📞 Call module initialized (SFU ready)");
};

/**
 * Register Call-related socket handlers
 * Called for every new socket connection
 */
export const registerCallSockets = (
  io: Server,
  socket: Socket
) => {
  registerSFUSocketHandlers(io, socket);
};
