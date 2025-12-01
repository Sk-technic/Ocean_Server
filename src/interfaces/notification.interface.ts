import { Types } from "mongoose";

export interface IFromUser {
  _id: Types.ObjectId;
  profilePic?: string | null;
  username?: string | null;
  fullName?: string | null;
}

export interface ISingleNotification {
  type: "follow" | "follow-request" | "request-accepted" | "like" | "comment";
  fromUser: IFromUser;
  text?: string | null;
  postId?: Types.ObjectId | null;
  isRead: boolean;
  createdAt: Date;
}

export interface INotificationInbox {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  unreadCount: number;
  notifications: ISingleNotification[];
  createdAt?: Date;
  updatedAt?: Date;
}
