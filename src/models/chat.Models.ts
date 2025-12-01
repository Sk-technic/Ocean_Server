import mongoose, { Schema } from "mongoose";
import { IChatRoom, IMessage } from "interfaces/chat.interface";

// ---------------- CHAT ROOM MODEL ----------------
const ChatRoomSchema = new Schema<IChatRoom>(
  {
    // Core
    isGroup: { type: Boolean, default: false },
    name: { type: String, trim: true },

    // Per-user participant state
    participants: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        unreadCount: { type: Number, default: 0 },
        isMuted: { type: Boolean, default: false },
        isArchived: { type: Boolean, default: false },
        lastSeenAt: { type: Date, default: null }
      }
    ],
    createdBy:{
      type:Schema.Types.ObjectId,
      ref:"User"
    },
    // Group specific
    groupAdmin: [{ type: Schema.Types.ObjectId, ref: "User" }],
    description: { type: String, trim: true },
    avatar: { type: String },

    // Chat metadata
    lastMessageMeta: {
      text: String,
      sender: { type: Schema.Types.ObjectId, ref: "User" },
      messageType: { type: String, default: "text" },
      createdAt: Date,
    },
    status:{
      type:String,
      enum:["active","request"],
      default:"active"
    },
    pinnedMessages: [{ type: Schema.Types.ObjectId, ref: "Message" }],

    // Chat clear history
    clearChat: [
      {
        lastClearAt: { type: Date },
        byUser: { type: Schema.Types.ObjectId, ref: "User" }
      }
    ],
  },
  { timestamps: true }
);
// Indexes
ChatRoomSchema.index({ participants: 1 }); // correct field name
ChatRoomSchema.index({ updatedAt: -1 }); // sort recent first
ChatRoomSchema.index({ isGroup: 1 });

export const ChatRoom = mongoose.model<IChatRoom>(
  "ChatRoom",
  ChatRoomSchema
);
const MessageSchema = new Schema<IMessage>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },

    content: { type: String, trim: true, },

    mentions: [{ type: Schema.Types.ObjectId, ref: "User" }], // ✅ @mentions

    media: [{
      url: String,
      type: { type: String, enum: ["image", "video", "audio", "file"] },
      thumbnail: String,
      size: Number,
      duration: Number,
    }],

    messageType: {
      type: String,
      enum: ["text", "media", "image", "reply", "forward", "video", "audio"],
      default: "text",
    },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message" },

    reactions: {
      type: Map,
      of: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: {},
    },

    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    deliveredTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
    seenBy: [ {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
   },
    time: {
      type: Number,
      default: Date.now
    }
  }],

    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],

    status: {
      type: String,
      enum: ["send","seen","failed"],
      default: "send",
    },
  },
  { timestamps: true }
);

// Indexes
MessageSchema.index({ roomId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ status: 1 });

export const Message = mongoose.model<IMessage>(
  "Message",
  MessageSchema
);
