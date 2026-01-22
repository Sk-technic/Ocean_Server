import { mediasoupConfig } from "../config/mediasoup";
import * as mediasoup from "mediasoup";

let worker: mediasoup.types.Worker;

export const createMediasoupWorker = async () => {
  worker = await mediasoup.createWorker({
    rtcMinPort: mediasoupConfig.worker.rtcMinPort,
    rtcMaxPort: mediasoupConfig.worker.rtcMaxPort,
    logLevel: mediasoupConfig.worker.logLevel,
    logTags: mediasoupConfig.worker.logTags
  });

  console.log("✅ Mediasoup Worker started");

  worker.on("died", () => {
    console.error("❌ Mediasoup Worker died");
    setTimeout(() => process.exit(1), 2000);
  });

  return worker;
};

export const getWorker = () => {
  if (!worker) throw new Error("Mediasoup worker not initialized");
  return worker;
};
