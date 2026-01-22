import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { createServer } from "http";
import { initSocket } from "./socket/socket";
import { connectDB } from "./config/db";
import { createMediasoupWorker } from "./mediasoup/worker";

const PORT: number = Number(process.env.PORT) || 5000;

const httpServer = createServer(app);


connectDB()
  .then(async () => {
    const io = await initSocket(httpServer);
    httpServer.listen(PORT, () => {
      console.log(`🌐  REST API:   http://localhost:${PORT}`);
      console.log(`🔌  Socket.IO:  ws://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB CONN ERR: ", err);
  })

async function connectWorker() {
  await createMediasoupWorker();
}

connectWorker()

