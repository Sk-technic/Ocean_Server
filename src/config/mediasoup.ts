import type { WorkerLogTag,WorkerLogLevel,RouterRtpCodecCapability,
  MediaKind } from "mediasoup/node/lib/types";


export const mediasoupConfig = {
  worker: {
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    logLevel: "warn" as WorkerLogLevel,
    logTags: ["info", "ice", "dtls", "rtp", "srtp"] as WorkerLogTag[]
  },

  router: {
    mediaCodecs: [
      {
        kind: "audio" as MediaKind,
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2
      },
      {
        kind: "video" as MediaKind,
        mimeType: "video/VP8",
        clockRate: 90000,
        parameters: {}
      }
    ] as RouterRtpCodecCapability[]
  },

  webRtcTransport: {
    listenIps: [
      {
        ip: "0.0.0.0",
        // announcedIp: process.env.PUBLIC_IP || "127.0.0.1"
      }
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true
  }
};
