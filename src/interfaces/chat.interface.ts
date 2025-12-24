import { Document, Types } from "mongoose";


export interface IMedia {
  url: string;
  type: "image" | "video" | "audio" | "file";
  thumbnail?: string;
  size?: number;
  duration?: number;
}


export interface IMessage extends Document {
  _id: Types.ObjectId;

  roomId: Types.ObjectId;
  sender: Types.ObjectId;

  type: "text" | "image" | "video" | "audio" | "file" | "system";

  content?: string;
  media?: IMedia[];

  replyTo?: Types.ObjectId;

  reactions?: Map<string, Types.ObjectId[]>; // 👍 => [userIds]

  mentions?: Types.ObjectId[];
  status:"send"|"pending"|"seen";
  isEdited: boolean;
  isDeleted: boolean;
  deletedFor?: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}


export interface IChatRoom extends Document {
  _id: Types.ObjectId;

  type: "dm" | "group";

  // DM specific
  membersHash?: string;

  // Group specific
  name?: string;
  description?: string;
  avatar?: string;

  createdBy: Types.ObjectId;
  admins: Types.ObjectId[];

  lastMessageMeta?: {
    messageId: Types.ObjectId;
    text?: string;
    sender: Types.ObjectId;
    messageType: string;
    createdAt: Date;
  };

  status: "active" | "request" | "blocked";

  createdAt: Date;
  updatedAt: Date;
}


export interface IChatMember extends Document {
  _id: Types.ObjectId;

  roomId: Types.ObjectId;
  userId: Types.ObjectId;

  role: "member" | "admin";

  unreadCount: number;
  lastActive: Date | null;

clearChatAt?:Date|null;
  isMuted: boolean;
  isArchived: boolean;
  isBlocked: boolean;

  joinedAt: Date;
  leftAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
