import { Types, Document } from "mongoose";

/* --------------------------------
   🔹 MESSAGE INTERFACE
----------------------------------*/
export interface IMedia {

  url?: string;
  type?: "image" | "video" | "audio" | "file";
  thumbnail?: string;
  size?: number;
  duration?: number;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  roomId: Types.ObjectId;
  sender: Types.ObjectId;
  content?: string;
  media?: IMedia[];
  messageType: "text" | "media" | "image" | "reply" | "forward" | "video" | "audio";
  replyTo?: Types.ObjectId;
  reactions?: Map<string, Types.ObjectId[]>; // emoji => [userIds]
  readBy?: Types.ObjectId[];
  deliveredTo?: Types.ObjectId[];
  seenBy?: {
    user:string;
    time:Date;
  }[];
  mentions?: Types.ObjectId[];
  isEdited?: boolean;
  isDeleted?: boolean;
  deletedFor?: Types.ObjectId[];
  status: "send" | "seen"  | "failed";
  createdAt?: Date;
  updatedAt?: Date;
}

/* --------------------------------
   🔹 CHAT ROOM INTERFACE
----------------------------------*/
export interface IChatRoom extends Document {
  _id: Types.ObjectId;

  // Core
  isGroup: boolean;
  name?: string;
  createdBy:Types.ObjectId;
  // Per-user participant state
  participants: {
    _id:Types.ObjectId,
    user: Types.ObjectId;
    unreadCount: number;
    isMuted: boolean;
    isArchived: boolean;
    lastSeenAt: Date | null;
  }[];

  status:string;
  // Group-specific
  groupAdmin?: Types.ObjectId[];
  description?: string;
  avatar?: string;

  // Chat metadata
  lastMessageMeta?: {
    text?: string;
    sender?: Types.ObjectId;
    messageType: string;
    createdAt?: Date;
  };

  pinnedMessages?: Types.ObjectId[];

  // Chat clear history
  clearChat: {
    byUser: string;
    lastClearAt: Date;
  }[];

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Participant {
  _id: string;
  username: string;
  fullName: string;
  profilePic?: string;
  email?: string;
  isActive: boolean;
}

export interface RoomResponse {
  _id: string;
  isGroup: boolean;
  name?: string;
  description?: string;
  avatar?: string;
  groupAdmin?: string;
  lastMessageMeta?: any;
  ponnedMessage?: any;
  unreadCount?: number;
  isMuted?: boolean;
  isArchived?: boolean;
  participants: Participant[];
}