import { IChatMember, IChatRoom, IMessage } from "interfaces/chat.interface";
import mongoose, { Schema, Document, Types } from "mongoose";
const MediaSchema = new Schema(
  {
    url: { type: String, required: true },

    type: {
      type: String,
      enum: ["image", "video", "audio", "file"],
      required: true,
    },

    thumbnail: { type: String },
    size: { type: Number },
    duration: { type: Number },
  },
  { _id: false }
);


const MessageSchema = new Schema<IMessage>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "file", "system"],
      default: "text",
    },

    content: String,

    media: [
      {
        type: MediaSchema,
        default: []
      },
    ],

    status:{
      type:String,
      enum:["send","pending","seen"],
      default:"pending"
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },

    reactions: {
      type: Map,
      of: [Schema.Types.ObjectId],
      default: {},
    },

    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],

    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Message Indexes
MessageSchema.index({ roomId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });


const ChatRoomSchema = new Schema<IChatRoom>(
  {
    type: {
      type: String,
      enum: ["dm", "group"],
      required: true,
    },

    membersHash: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: String,
    description: String,
    avatar: String,

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],

    lastMessageMeta: {
      messageId: { type: Schema.Types.ObjectId, ref: "Message" },
      text: String,
      sender: { type: Schema.Types.ObjectId, ref: "User" },
      messageType: String,
      createdAt: Date,
    },

    status: {
      type: String,
      enum: ["active", "request", "blocked"],
      default: "request",
    },
  },
  { timestamps: true }
);

ChatRoomSchema.index({ type: 1 });
ChatRoomSchema.index({ updatedAt: -1 });


const ChatMemberSchema = new Schema<IChatMember>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clearChatAt: { type: Date, default: null },

    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },

    unreadCount: { type: Number, default: 0 },
    lastActive: { type: Date, default: null },

    isMuted: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },

    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
  },
  { timestamps: true }
);

ChatMemberSchema.index(
  { roomId: 1, userId: 1 },
  { unique: true }
);
ChatMemberSchema.index({ userId: 1 });
ChatMemberSchema.index({ roomId: 1 });

export const ChatRoom = mongoose.model<IChatRoom>(
  "ChatRoom",
  ChatRoomSchema
);

export const ChatMember = mongoose.model<IChatMember>(
  "ChatMember",
  ChatMemberSchema
);

export const Message = mongoose.model<IMessage>(
  "Message",
  MessageSchema
);