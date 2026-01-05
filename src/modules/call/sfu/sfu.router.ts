import type {
  Router,
  RouterRtpCodecCapability,
} from "mediasoup/node/lib/types";
import { getSFUWorker } from "./sfu.worker";

/**
 * Media codecs supported by SFU
 */
const mediaCodecs: RouterRtpCodecCapability[] = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
  },
];

export const createSFURouter = async (): Promise<Router> => {
  const worker = getSFUWorker();

  const router = await worker.createRouter({
    mediaCodecs,
  });

  return router;
};
