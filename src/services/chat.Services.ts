import { ApiError } from "../utils/ApiError";
import { Collections } from "../models";
import { Request } from "express";
import { deleteFromCloudinary, optimizeCloudinaryUrl, uploadMediaCloudinary, uploadToCloudinary } from "../utils/cloudinary";
import mongoose, { Types } from "mongoose";
import { RoomResponse } from "interfaces/chat.interface";
import { publishMessage } from "../events/redis/chat.Pub";
import { RedisHelpers } from "../utils/redisHelper";
import { getCloudinaryThumbnailFromUrl } from "../utils/getVideothubnail";

interface SendMessage {
  receiverId: string;
  content: string;
  messageType: string;
  senderId: string;
  replyTo?: string | null;
  roomId: string
}

export const createSingleRoom = async ({
  userId,
  toUserId,
}: {
  userId: string;
  toUserId: string;
}) => {
  const userObj = new mongoose.Types.ObjectId(userId);
  const toUserObj = new mongoose.Types.ObjectId(toUserId);

  let chatRoom = await Collections.ChatRoom.findOne({
    isGroup: false,
    "participants.user": { $all: [userObj, toUserObj] },
    $expr: { $eq: [{ $size: "$participants" }, 2] },
  }).populate("participants.user", "profilePic username fullName email");

  if (chatRoom) {
    return [chatRoom];
  }

  chatRoom = await Collections.ChatRoom.create({
    isGroup: false,
    createdBy: userId,
    participants: [
      {
        user: userObj,
        unreadCount: 0,
        isMuted: false,
        isArchived: false,
        lastSeenAt: null,
      },
      {
        user: toUserObj,
        unreadCount: 0,
        isMuted: false,
        isArchived: false,
        lastSeenAt: null,
      },
    ],
    status: "request"
  });

  const rooms = await Collections.ChatRoom.aggregate([
    { $match: { _id: chatRoom._id } },

    // extract participant.user IDs for lookup
    {
      $addFields: {
        participantUsers: "$participants.user",
      },
    },

    // lookup user details
    {
      $lookup: {
        from: "users",
        localField: "participantUsers",
        foreignField: "_id",
        as: "userDetails",
      },
    },

    {
      $project: {
        _id: 1,
        isGroup: 1,
        name: 1,
        avatar: 1,
        groupAdmin: 1,
        lastMessageMeta: 1,
        participants: {
          $map: {
            input: "$participants",
            as: "p",
            in: {
              _id: "$$p.user",
              unreadCount: "$$p.unreadCount",
              isMuted: "$$p.isMuted",
              isArchived: "$$p.isArchived",
              lastSeenAt: "$$p.lastSeenAt",

              // merge user details
              userDetails: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$userDetails",
                      as: "ud",
                      cond: { $eq: ["$$ud._id", "$$p.user"] }
                    }
                  },
                  0
                ]
              }
            },
          },
        },
      },
    },

    // final formatting to flatten structure
    {
      $addFields: {
        participants: {
          $map: {
            input: "$participants",
            as: "p",
            in: {
              _id: "$$p._id",
              unreadCount: "$$p.unreadCount",
              isMuted: "$$p.isMuted",
              isArchived: "$$p.isArchived",
              lastSeenAt: "$$p.lastSeenAt",
              username: "$$p.userDetails.username",
              fullName: "$$p.userDetails.fullName",
              profilePic: "$$p.userDetails.profilePic",
              email: "$$p.userDetails.email",
            }
          }
        }
      }
    }
  ]);

  return rooms;
};

export const sendMessage = async (message: SendMessage) => {
  const { content, messageType, senderId, replyTo, roomId } = message;

  if (!roomId || !senderId || !content) {
    throw new Error("Missing required fields");
  }

  const chatRoom = await Collections.ChatRoom.findById(roomId);

  if (!chatRoom) {
    throw new Error("Chat room not found");
  }
  if (chatRoom?.status == "request") {
    if (chatRoom.createdBy.toString() !== senderId) {
      throw new Error("You must accept the message request before replying.");
    }
  }

  // 2. Create Message
  const newMessage = await Collections.Message.create({
    roomId,
    sender: senderId,
    content,
    messageType,
    replyTo: replyTo || null,
  });

  // 3. Update last message meta + increment unread for others
  await Collections.ChatRoom.updateOne(
    { _id: roomId },
    {
      $set: {
        lastMessageMeta: {
          text: messageType === "text" ? content : "",
          sender: senderId,
          messageType,
          createdAt: newMessage.createdAt,
        },
        "participants.$[sender].lastSeenAt": new Date(), // sender is up to date
      },
      $inc: {
        "participants.$[receiver].unreadCount": 1, // receivers get unread increment
      },
    },
    {
      arrayFilters: [
        { "sender.user": senderId },
        { "receiver.user": { $ne: senderId } },
      ],
    }
  );

  // 4. Fetch populated message for response
  let extractedMessage: any = await Collections.Message.findById(newMessage._id)
    .select(
      "_id roomId sender content media messageType replyTo reactions readBy deliveredTo isEdited isDeleted createdAt status"
    )
    .populate("sender", "username fullName profilePic")
    .populate({
      path: "replyTo",
      select: "_id content media messageType isDeleted sender",
      populate: {
        path: "sender",
        select: "username fullName profilePic",
      },
    })
    .lean();

  // 5. (Optional) reply media simplification remains same
  if (extractedMessage?.replyTo) {
    const reply = extractedMessage.replyTo;

    if (reply.media?.length > 0) {
      const file = reply.media[0];

      let thumbnail = file.thumbnail;

      if (!thumbnail && file.url && file.resourceType === "video") {
        thumbnail = file.url.replace("/upload/", "/upload/so_1/");
      }

      if (!thumbnail && file.resourceType === "image") {
        thumbnail = file.url;
      }

      reply.media = [
        {
          resourceType: file.resourceType,
          thumbnail,
        },
      ];
    }
  }

  // 6. Return refreshed room state for UI
  const updatedRoom = await Collections.ChatRoom.findById(roomId).lean();

  const newUpdatedRoom = updatedRoom?.participants
    .filter((p: any) => p.user.toString() !== senderId)
    .map((p: any) => p.user.toString())
  return {
    message: extractedMessage,
    room: updatedRoom,
    receiverIds: newUpdatedRoom
  };
};

export const sendMedia = async (req: Request) => {
  const { content, messageType, senderId, roomId, replyTo } = req.body;

  const media = (req.files as any)?.media;
  const files = Array.isArray(media) ? media : [media];

  const RoomDetails = await Collections.ChatRoom.findById(roomId);

  if (RoomDetails?.status == "request") {
    if (RoomDetails.createdBy.toString() !== senderId) {
      throw new Error("You must accept the message request before replying.");
    }
  }
  if (!senderId || !messageType) {
    throw new ApiError(400, "Missing required fields: senderId or messageType!");
  }

  if (!files || files.length === 0 || !files[0]) {
    throw new ApiError(400, "No media files provided!");
  }


  const allowedTypes = ["image", "video", "audio"];
  const invalidFiles = files.filter(
    (file: any) =>
      !file.mimetype.startsWith("image/") &&
      !file.mimetype.startsWith("video/") &&
      !file.mimetype.startsWith("audio/")
  );

  if (invalidFiles.length > 0) {
    const invalidNames = invalidFiles.map((f: any) => f.originalname).join(", ");
    throw new ApiError(
      400,
      `Invalid file type detected: ${invalidNames}. Only images, videos, and audio are allowed.`
    );
  }

  let uploadedMedia;
  try {
    uploadedMedia = await Promise.all(
      files.map(async (file: any) => {
        const filetype = file.mimetype.split("/")[0];

        const media = await uploadMediaCloudinary(file.path, {
          resource_type: filetype,
        });

        if (!allowedTypes.includes(media?.resource_type)) {
          throw new ApiError(400, `Unsupported media type: ${media?.resource_type}`);
        }

        let thumbnail = null;

        if (media?.resource_type === "video") {
          thumbnail = getCloudinaryThumbnailFromUrl(media?.secure_url);
        }

        if (!thumbnail) thumbnail = media?.secure_url;

        return {
          url: media?.secure_url,
          type: media?.resource_type,
          size: media?.bytes?.toString(),
          duration: media?.duration?.toString() || null,
          thumbnail,
          resourceType: media?.resource_type,
        };
      })
    );
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new ApiError(500, "Failed to upload one or more files to Cloudinary");
  }

  const chatRoom = await Collections.ChatRoom.findById(roomId);
  if (!chatRoom) throw new ApiError(404, "Chat room not found!");

  const mediaMessage = await Collections.Message.create({
    roomId: chatRoom._id,
    sender: senderId,
    content: content || null,
    messageType: uploadedMedia[0]?.type || "media",
    media: uploadedMedia,
    replyTo: replyTo || null,
  });

  const previewText = `send ${uploadedMedia.length} ${uploadedMedia[0]?.type}`;

  await Collections.ChatRoom.updateOne(
    { _id: roomId },
    {
      $set: {
        lastMessageMeta: {
          text: previewText,
          sender: senderId,
          messageType: mediaMessage.messageType,
          createdAt: mediaMessage.createdAt,
        },
        "participants.$[sender].lastSeenAt": new Date(),
      },
      $inc: {
        "participants.$[receiver].unreadCount": 1,
      },
    },
    {
      arrayFilters: [
        { "sender.user": senderId },
        { "receiver.user": { $ne: senderId } },
      ],
    }
  );

  let extractedMessage: any = await Collections.Message.findById(mediaMessage._id)
    .select(
      "_id roomId sender content media messageType replyTo reactions readBy deliveredTo isEdited isDeleted createdAt status"
    )
    .populate("sender", "username fullName profilePic")
    .populate({
      path: "replyTo",
      select: "_id content media messageType isDeleted sender",
      populate: {
        path: "sender",
        select: "username fullName profilePic",
      },
    })
    .lean();

  if (extractedMessage?.replyTo?.media?.length > 0) {
    const file = extractedMessage.replyTo.media[0];
    extractedMessage.replyTo.media = [
      {
        resourceType: file.resourceType,
        thumbnail: file.thumbnail || file.url,
      },
    ];
  }

  const finalMessage = {
    ...extractedMessage,
    lastMessage: previewText,
  };

  const updatedRoom = await Collections.ChatRoom.findById(roomId).lean();

  const receiverIds = updatedRoom?.participants
    .filter((p: any) => p.user.toString() !== senderId)
    .map((p: any) => p.user.toString());
  const ChatRoomId = finalMessage?.roomId.toString()
  const payload = {
    room: updatedRoom,
    recivers: receiverIds,
    message: {
      ...finalMessage
    }
  }

  await publishMessage(ChatRoomId, payload)
};

export const getMessages = async (req: Request) => {
  const { roomId } = req.params;
  const { cursor, limit } = req.query;

  if (!roomId) throw new ApiError(400, "Room ID is required");

  const limitNum = Number(limit) || 50;

  const query: any = { roomId };

  const room = await Collections.ChatRoom.findById(roomId).lean();

  let lastClearAt: Date | null = null;

  if (room?.clearChat && Array.isArray(room.clearChat)) {
    const userClear = room.clearChat.find(
      (c: any) => c.byUser?.toString() === req.identity.toString()
    );

    if (userClear?.lastClearAt) {
      lastClearAt = userClear.lastClearAt;
      query.createdAt = { $gt: lastClearAt };
    }
  }

  if (cursor) {
    const cursorMsg = await Collections.Message.findById(cursor).select("createdAt");

    if (cursorMsg) {
      query.createdAt = {
        ...(query.createdAt || {}),
        $lt: cursorMsg.createdAt,
      };
    }
  }

  let messages = await Collections.Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limitNum + 1)
    .select(
      "_id roomId sender content media messageType replyTo reactions readBy deliveredTo isEdited isDeleted createdAt status"
    )
    .populate("sender", "username fullName profilePic")
    .populate({
      path: "replyTo",
      select: "content sender media messageType createdAt",
      populate: { path: "sender", select: "username fullName profilePic" },
    })
    .lean();

  const hasMore = messages.length > limitNum;

  if (hasMore) messages = messages.slice(0, limitNum);

  messages.reverse();

  const nextCursor = hasMore ? messages[0]._id : null;

  return {
    message: "Fetched messages.",
    messages,
    nextCursor,
    hasMore,
    noMoreMessages: !hasMore,
  };
};

export const chatRooms = async (req: Request) => {
  const { id } = req.query;
  if (!id) throw new ApiError(403, "User ID not provided.");

  const userId = new mongoose.Types.ObjectId(String(id));

  const chatRooms = await Collections.ChatRoom.aggregate([
    {
      $match: {
        "participants.user": userId,
        "lastMessageMeta.text": { $exists: true, $ne: "" }
      }
    },

    {
      $addFields: {
        participantUsers: "$participants.user"
      }
    },

    {
      $lookup: {
        from: "users",
        localField: "participantUsers",
        foreignField: "_id",
        as: "userDetails"
      }
    },

    {
      $addFields: {
        participants: {
          $map: {
            input: "$participants",
            as: "p",
            in: {
              _id: "$$p.user",
              unreadCount: "$$p.unreadCount",
              isMuted: "$$p.isMuted",
              isArchived: "$$p.isArchived",
              lastSeenAt: "$$p.lastSeenAt",
              userDetails: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$userDetails",
                      as: "ud",
                      cond: { $eq: ["$$ud._id", "$$p.user"] }
                    }
                  },
                  0
                ]
              }
            }
          }
        }
      }
    },

    {
      $project: {
        _id: 1,
        isGroup: 1,
        name: 1,
        avatar: 1,
        groupAdmin: 1,
        lastMessageMeta: 1,
        status: 1,
        createdBy: 1,
        participants: {
          $map: {
            input: "$participants",
            as: "p",
            in: {
              _id: "$$p._id",
              username: "$$p.userDetails.username",
              fullName: "$$p.userDetails.fullName",
              profilePic: "$$p.userDetails.profilePic",
              email: "$$p.userDetails.email",
              unreadCount: "$$p.unreadCount",
              lastSeenAt: "$$p.lastSeenAt",
            }
          }
        }
      }
    },

    { $sort: { "lastMessageMeta.createdAt": -1 } }
  ]);

  const allParticipantIds = chatRooms.flatMap((room) =>
    room.participants.map((p: any) => p._id.toString())
  );

  const presenceData = await RedisHelpers.getUsersOnlineStatus(allParticipantIds);
  const presenceMap = new Map(presenceData.map((u: any) => [u.userId, u]));

  const enrichedRooms = chatRooms.map((room: any) => ({
    ...room,
    participants: room.participants.map((p: any) => {
      const presence = presenceMap.get(p._id.toString());
      return {
        ...p,
        isOnline: presence?.isOnline || false,
        lastActive: presence?.lastActive
          ? new Date(Number(presence.lastActive))
          : p.lastActive || null,
      };
    }),
  }));

  const finalResult = enrichedRooms.map((room: any) => ({
    ...room,
    participants: room.participants.map((p: any) => ({
      ...p,
      profilePic: optimizeCloudinaryUrl(p.profilePic, 200, 200),
    })),
  }));

  return finalResult;
};

export const GetRoomDetails = async (req: Request): Promise<RoomResponse> => {
  const { roomId, userId } = req.query as { roomId: string; userId: string };

  if (!roomId || !userId) {
    throw new ApiError(400, "roomId and userId are required.");
  }

  const userObj = new mongoose.Types.ObjectId(userId);

  const result = await Collections.ChatRoom.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(roomId),
        "participants.user": userObj
      }
    },

    {
      $addFields: {
        participantUsers: "$participants.user"
      }
    },

    {
      $lookup: {
        from: "users",
        localField: "participantUsers",
        foreignField: "_id",
        as: "userDetails"
      }
    },

    {
      $addFields: {
        participants: {
          $map: {
            input: "$participants",
            as: "p",
            in: {
              _id: "$$p.user",
              unreadCount: "$$p.unreadCount",
              isMuted: "$$p.isMuted",
              isArchived: "$$p.isArchived",
              lastSeenAt: "$$p.lastSeenAt",
              userDetails: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$userDetails",
                      as: "ud",
                      cond: { $eq: ["$$ud._id", "$$p.user"] }
                    }
                  },
                  0
                ]
              }
            }
          }
        }
      }
    },

    {
      $addFields: {
        currentUserState: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$participants",
                as: "p",
                cond: { $eq: ["$$p._id", userObj] }
              }
            },
            0
          ]
        }
      }
    },

    {
      $project: {
        _id: 1,
        isGroup: 1,
        name: 1,
        description: 1,
        avatar: 1,
        groupAdmin: 1,
        lastMessageMeta: 1,
        pinnedMessages: 1,
        status: 1,
        createdBy: 1,
        unreadCount: "$currentUserState.unreadCount",
        isMuted: "$currentUserState.isMuted",
        isArchived: "$currentUserState.isArchived",
        lastSeenAt: "$currentUserState.lastSeenAt",

        participants: {
          $map: {
            input: "$participants",
            as: "p",
            in: {
              _id: "$$p._id",
              username: "$$p.userDetails.username",
              fullName: "$$p.userDetails.fullName",
              profilePic: "$$p.userDetails.profilePic",
              email: "$$p.userDetails.email",
              unreadCount: "$$p.unreadCount",
              lastSeenAt: "$$p.lastSeenAt"
            }
          }
        }
      }
    }
  ]);

  if (!result || result.length === 0) {
    throw new ApiError(404, "Room not found or you are not a participant.");
  }

  return result[0];
};

export const unsendMessage = async ({
  messageId,
  roomId,
  userId
}: {
  messageId: string;
  roomId: string;
  userId: string;
}) => {
  if (!messageId || !roomId || !userId) {
    throw new ApiError(400, "Missing required fields.");
  }

  const originalMessage = await Collections.Message.findOne({
    _id: messageId,
    roomId,
    sender: userId,
    isDeleted: false,
  });

  if (!originalMessage) {
    throw new ApiError(404, "Message not found or already deleted.");
  }

  const hasMedia = originalMessage.media && originalMessage.media.length > 0;

  const newContent = hasMedia
    ? "This message was removed or is no longer accessible."
    : "This message was unsent.";

  const unsendText = hasMedia ? "media unavailable" : "This message was unsent.";

  const roomDetails = await Collections.ChatRoom.findById(roomId);

  if (
    roomDetails &&
    originalMessage?.createdAt?.getTime() ===
    roomDetails.lastMessageMeta?.createdAt?.getTime()
  ) {
    await Collections.ChatRoom.findByIdAndUpdate(roomId, {
      $set: {
        "lastMessageMeta.text": unsendText,
        "lastMessageMeta.sender": userId,
        "lastMessageMeta.messageType": "text",
      },
    });
  }

  const updatedMessage = await Collections.Message.findOneAndUpdate(
    {
      _id: messageId,
      roomId,
      sender: userId,
      isDeleted: false,
    },
    {
      $set: { isDeleted: true, content: newContent },
    },
    { new: true }
  ).populate("sender", "username fullName profilePic");

  if (hasMedia) {
    const mediaList = originalMessage.media!;

    await Promise.all(
      mediaList.map(async (mediaItem) => {
        await deleteFromCloudinary(mediaItem?.url ?? '');
      })
    );

    updatedMessage!.media = [];
    await updatedMessage!.save();
  }

  const payload = {
    ...updatedMessage!.toObject(),
    lastMessage: unsendText
  }

  await publishMessage(roomId, payload)
  // 6. Return refreshed room state for UI
  const updatedRoom = await Collections.ChatRoom.findById(roomId).lean();

  const newUpdatedRoom = updatedRoom?.participants
    .filter((p: any) => p.user.toString() !== payload?.sender?._id)
    .map((p: any) => p.user.toString())
  return {
    message: {
      ...updatedMessage!.toObject(),
      lastMessage: unsendText,
    },
    receiverIds: newUpdatedRoom
  };
};

export const editMessage = async (
  messageId: string,
  roomId: string,
  newContent: string,
  userId: string
) => {
  if (!messageId || !newContent) throw new Error("Missing Required Fields!");

  const updatedMessage = await Collections.Message.findOneAndUpdate(
    {
      _id: messageId,
      messageType: "text",
      isDeleted: false,
      roomId: roomId,
      sender: userId
    },
    {
      $set: { content: newContent, isEdited: true },
    },
    { new: true }
  )
    .populate("sender", "username fullName profilePic")
    .lean();

  if (!updatedMessage) throw new Error("Message not found or deleted");

  const roomDetails = await Collections.ChatRoom.findById(roomId);

  if (
    roomDetails &&
    updatedMessage?.createdAt?.getTime() ===
    roomDetails.lastMessageMeta?.createdAt?.getTime()
  ) {
    await Collections.ChatRoom.findByIdAndUpdate(roomId, {
      $set: {
        "lastMessageMeta.text": updatedMessage.content,
        "lastMessageMeta.messageType": "text",
      },
    });
  }

  return {
    ...updatedMessage,
    lastMessage: updatedMessage.content
  };
};

export const clearChat = async (byUser: string, roomId: string) => {
  if (!byUser || !roomId) throw new Error("Fields are missing.");

  const room = await Collections.ChatRoom.findById(roomId);
  if (!room) throw new Error("Room not found.");
  if (room.isGroup) throw new Error("You cannot clear chat in a group.");

  if (!room.clearChat) {
    room.clearChat = [];
  }

  room.clearChat = room.clearChat.filter(
    c => c.byUser.toString() !== byUser.toString()
  );

  room.clearChat.push({
    byUser,
    lastClearAt: new Date()
  });

  await room.save();

  return room._id;
};

export const readChat = async (userId: string, roomId: string) => {
  const roomDetails = await Collections.ChatRoom.findById(roomId)
  if (roomDetails?.status == "request") return

  await Collections.ChatRoom.updateOne(
    { _id: roomId, "participants.user": userId },
    {
      $set: {
        "participants.$.unreadCount": 0,
        "participants.$.lastSeenAt": new Date()
      }
    }
  );

  const updatedRoom = await Collections.ChatRoom.findById(roomId).lean();

  return updatedRoom

}
export const MessageSeenUpdate = async (
  userId: string,
  roomId: string,
  messageId: string
) => {
  const roomDetails = await Collections.ChatRoom.findById(roomId);
  if (roomDetails?.status == "request") return;
  const message = await Collections.Message.findById(messageId);

  if (!message) throw new Error("Message not found");

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // STEP 1: Check if user already exists in seenBy
  const alreadySeen = message?.seenBy?.some(
    (entry: any) => entry.user.toString() === userId
  );

  // STEP 2: Add only 1 time
  if (!alreadySeen) {
    await Collections.Message.updateOne(
      { _id: messageId },
      {
        $push: {
          seenBy: {
            user: userObjectId,
            time: Date.now(), // First-time only
          },
        },
      }
    );
  }

  // STEP 3: UNIVERSAL status update (Group + Private)
  const totalMembers = roomDetails?.participants.length ?? 0;

  const msgAfter = alreadySeen
    ? message
    : await Collections.Message.findById(messageId);

  if ((msgAfter?.seenBy?.length ?? 0) === totalMembers) {
    await Collections.Message.updateOne(
      { _id: messageId },
      { $set: { status: "seen" } }
    );
  }

  // STEP 4: Final populated message
  const finalMessage = await Collections.Message.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(messageId) } },

    {
      $lookup: {
        from: "users",
        localField: "sender",
        foreignField: "_id",
        as: "senderData",
      },
    },
    { $unwind: "$senderData" },

    { $unwind: { path: "$seenBy", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "users",
        localField: "seenBy.user",
        foreignField: "_id",
        as: "userData",
      },
    },
    { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },

    {
      $group: {
        _id: "$_id",
        content: { $first: "$content" },
        roomId: { $first: "$roomId" },
        status: { $first: "$status" },
        createdAt: { $first: "$createdAt" },

        sender: {
          $first: {
            _id: "$senderData._id",
            fullName: "$senderData.fullName",
            username: "$senderData.username",
            email: "$senderData.email",
            profilePic: "$senderData.profilePic",
          },
        },

        seenBy: {
          $push: {
            user: {
              _id: "$userData._id",
              fullName: "$userData.fullName",
              profilePic: "$userData.profilePic",
            },
            time: "$seenBy.time",
          },
        },
      },
    },
  ]);

  return finalMessage[0];
};

export const acceptMessageRequest = async (
  userId: string,
  roomId: string,
  createdBy: string
) => {
  if (!userId || !roomId || !createdBy) {
    throw new Error("Missing required fields (userId, roomId, createdBy).");
  }
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(roomId) ||
    !mongoose.Types.ObjectId.isValid(createdBy)
  ) {
    throw new Error("Invalid ObjectId format provided.");
  }
  const room = await Collections.ChatRoom.findOneAndUpdate(
    {
      _id: (roomId),
      isGroup: false,
      createdBy: createdBy,
      status: "request",
      "participants.user": userId,
    },
    {
      $set: { status: "active" }
    },
    { new: true }
  );

  if (!room) {
    throw new Error(
      "Message request cannot be accepted. Either the room doesn't exist, is not pending, or this user is not allowed to accept."
    );
  }

  return room;
};
