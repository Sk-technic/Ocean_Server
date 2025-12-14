import { Types } from "mongoose";
export interface INotification extends Document {
  _id?: Types.ObjectId;

  user: Types.ObjectId;       // receiver
  actor: Types.ObjectId;      // who performed action

  type:
    | "follow"
    | "follow-request"
    | "request-accepted"
    | "like"
    | "comment"
    | "mention";

  postId?: Types.ObjectId | null;

  message?: string;

  isRead: boolean;
  readAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}