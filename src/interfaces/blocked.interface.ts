import { Types } from "mongoose";

export interface IBlock {
    blocker: Types.ObjectId; // user who blocked
    blocked: Types.ObjectId; // user who is blocked
    createdAt: Date;
}
