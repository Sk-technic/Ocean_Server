import { INotificationInbox } from "interfaces/notification.interface";
import { Schema, Types, model } from "mongoose";


const FromUserSchema = new Schema(
  {
    _id: {
      type: Types.ObjectId,
      required: true,
      ref: "User"
    },

    profilePic: {
      type: String,
      default: null
    },

    username: {
      type: String,
      default: null
    },

    fullName: {
      type: String,
      default: null
    },
  },
  { _id: false } // <-- IMPORTANT
);


// ------------------------------------
// Single Notification Item Schema
// ------------------------------------
const SingleNotificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["follow", "follow-request", "request-accepted", "like", "comment"],
      required: true
    },

    fromUser: {
      type: FromUserSchema,   // <-- FIX HERE
      required: true
    },

    text: { type: String, default: null },

    postId: { type: Types.ObjectId, ref: "Post", default: null },

    isRead: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now }
  },
);


// ------------------------------------
// Notification Inbox Schema
// ------------------------------------
const NotificationInboxSchema = new Schema<INotificationInbox>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },

    unreadCount: {
      type: Number,
      default: 0,
    },

    notifications: {
      type: [SingleNotificationSchema],
      default: [],
    }
  },
  { timestamps: true }
);

export const NotificationModel = model("NotificationInbox", NotificationInboxSchema);




// {
//   "type": "follow-request",
//   "fromUser": {
//     "_id": "675a32f59f11cf00126e98b7",
//     "username": "shubham_singh",
//     "fullName": "Shubham Singh",
//     "profilePic": "https://cdn.app.com/avatars/shubham.jpg"
//   },
//   "text": "Shubham Singh sent you a follow request",
//   "isRead": false,
//   "createdAt": "2025-01-12T10:25:40.123Z"
// }


// {
//   "user": "675a32f59f11cf00126e98b8",  
//   "unreadCount": 12,
//   "notification": {
//     "type": "follow-request",
//     "fromUser": {
//       "_id": "675a32f59f11cf00126e98b7",
//       "username": "shubham_singh",
//       "fullName": "Shubham Singh",
//       "profilePic": "https://cdn.app.com/avatars/shubham.jpg"
//     },
//     "text": "Shubham Singh sent you a follow request",
//     "createdAt": "2025-01-12T10:25:40.123Z",
//     "isRead": false
//   }
// }

// {
//   "type": "request-accepted",
//   "fromUser": {
//     "_id": "675a32f59f11cf00126e98b7",
//     "username": "rahul_dev",
//     "fullName": "Rahul Verma",
//     "profilePic": "https://cdn.app.com/avatars/rahul.jpg"
//   },
//   "text": "Rahul Verma accepted your follow request",
//   "isRead": false,
//   "createdAt": "2025-01-12T10:30:10.150Z"
// }

// {
//   "notification": {
//     "type": "request-accepted",
//     "fromUser": {
//       "_id": "675a32f59f11cf00126e98b7",
//       "username": "rahul_dev",
//       "fullName": "Rahul Verma",
//       "profilePic": "https://cdn.app.com/avatars/rahul.jpg"
//     },
//     "text": "Rahul Verma accepted your follow request",
//     "createdAt": "2025-01-12T10:30:10.150Z",
//     "isRead": false
//   },
//   "unreadCount": 13
// }