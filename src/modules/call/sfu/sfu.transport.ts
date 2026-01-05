import type {
  Router,
  WebRtcTransport,
} from "mediasoup/node/lib/types";

const WEB_RTC_TRANSPORT_OPTIONS = {
  listenIps: [
    {
      ip: "0.0.0.0",           // local
      announcedIp: process.env.PUBLIC_IP, // production
    },
  ],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
};

/**
 * Create WebRTC Transport (send / recv)
 */
export const createWebRtcTransport = async (
  router: Router
): Promise<WebRtcTransport> => {
  const transport = await router.createWebRtcTransport(
    WEB_RTC_TRANSPORT_OPTIONS
  );

  return transport;
};
