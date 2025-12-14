import { INotification } from "interfaces/notification.interface";
import { Schema, model, Types } from "mongoose";

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "follow",
        "follow-request",
        "request-accepted",
        "like",
        "comment",
        "mention",
      ],
      required: true,
      index: true,
    },

    postId: {
      type: Types.ObjectId,
      ref: "Post",
      default: null,
      index: true,
    },

    message: { type: String },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: { type: Date, default: null },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Indexes
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ user: 1, actor: 1, createdAt: -1 });

const NotificationModel = model<INotification>(
  "Notification",
  NotificationSchema
);

export default NotificationModel