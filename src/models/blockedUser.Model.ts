import { Schema, model } from "mongoose";
import type { IBlock } from "../interfaces/blocked.interface";

const BlockSchema = new Schema<IBlock>(
  {
    blocker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    blocked: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["blocked", "muted"],
      required: true,
    },

    roomId: {
      type: Schema.Types.ObjectId,
      ref: "ChatRoom",
      default: null,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

BlockSchema.index({ blocker: 1, blocked: 1, roomId: 1 }, { unique: true });

export const BlockModel = model<IBlock>("Block", BlockSchema);
