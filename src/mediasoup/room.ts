import type { Router } from "mediasoup/node/lib/types";
import { getWorker } from "./worker";
import { mediasoupConfig } from "../config/mediasoup";

export class Room {
  id: string;
  router?: Router;
  peers = new Map<string, any>();
  private initPromise?: Promise<void>;

  constructor(roomId: string) {
    this.id = roomId;
  }

  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const worker = getWorker();

      this.router = await worker.createRouter({
        mediaCodecs: mediasoupConfig.router.mediaCodecs
      });

      console.log(`🎥 Router created for room: ${this.id}`);
    })();

    return this.initPromise;
  }
}
