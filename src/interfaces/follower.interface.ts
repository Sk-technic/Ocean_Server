import mongoose from "mongoose";

import { Types } from "mongoose";

export interface IFollow extends Document {
  _id?: Types.ObjectId;
  follower: Types.ObjectId;     // jisne follow kiya
  following: Types.ObjectId;    // jisko follow kiya
  status: "rejected"|"requested" | "accepted" | "blocked";
  actionBy?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}
