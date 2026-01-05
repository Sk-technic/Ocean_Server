import mediasoup, { types as mediasoupTypes } from "mediasoup";

let worker: mediasoupTypes.Worker | null = null;

/**
 * Initialize SFU Worker
 * Call this ONCE on server startup
 */
export const initSFUWorker = async () => {
  if (worker) {
    return worker;
  }

  worker = await mediasoup.createWorker({
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    logLevel: "warn",
    logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"],
  });

  console.log("✅ SFU Worker started. PID:", worker.pid);

  worker.on("died", () => {
    console.error("❌ SFU Worker died. Exiting process...");
    setTimeout(() => {
      process.exit(1);
    }, 2000);
  });

  return worker;
};

/**
 * Get active SFU Worker
 * Used by router / room creators
 */
export const getSFUWorker = () => {
  if (!worker) {
    throw new Error(
      "SFU Worker not initialized. Call initSFUWorker() first."
    );
  }

  return worker;
};
