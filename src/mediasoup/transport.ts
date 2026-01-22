import { mediasoupConfig } from "../config/mediasoup";
import type { Router, WebRtcTransport } from "mediasoup/node/lib/types";

export const createWebRtcTransport = async (
  router: Router
): Promise<WebRtcTransport> => {

  const transport = await router.createWebRtcTransport({
    listenIps: mediasoupConfig.webRtcTransport.listenIps,
    enableUdp: mediasoupConfig.webRtcTransport.enableUdp,
    enableTcp: mediasoupConfig.webRtcTransport.enableTcp,
    preferUdp: mediasoupConfig.webRtcTransport.preferUdp
  });

  return transport;
};
