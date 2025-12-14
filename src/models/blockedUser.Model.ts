import { Schema, model, Types } from "mongoose";
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
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent duplicate block entries
BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export const BlockModel = model<IBlock>("Block", BlockSchema);
