import { ApiError } from "../utils/ApiError";
import { Collections } from "../models";
import { Request } from "express";
import { deleteFromCloudinary, optimizeCloudinaryUrl, uploadMediaCloudinary, uploadToCloudinary } from "../utils/cloudinary";
import mongoose, { Types } from "mongoose";
import { publishMessage } from "../events/redis/chat.Pub";
import { RedisHelpers } from "../utils/redisHelper";
import { getCloudinaryThumbnailFromUrl } from "../utils/getVideothubnail";

export const sendTextMessage = async ({
  roomId,
  senderId,
  content,
  toUserId,
  replyTo,
  tempId,
  senderSocketId,
}: {
  roomId?: string;
  senderId: string;
  toUserId?: string;
  content: string;
  replyTo?: string;
  tempId: string;
  senderSocketId: string;
}) => {
  let room;

  if (!roomId && toUserId) {
    const membersHash = [senderId, toUserId].sort().join("_");

    room = await Collections.ChatRoom.findOne({ type: "dm", membersHash });

    if (!room) {
      room = await Collections.ChatRoom.create({
        type: "dm",
        membersHash,
        createdBy: senderId,
        admins: [],
      });

      await Collections.ChatMember.insertMany([
        { roomId: room._id, userId: senderId },
        { roomId: room._id, userId: toUserId },
      ]);
    }
  } else {
    room = await Collections.ChatRoom.findById(roomId);
  }

  if (!room) throw new Error("Room not found");

  const message = await Collections.Message.create({
    roomId: room._id,
    sender: senderId,
    content,
    status: "send",
    type: "text",
    ...(replyTo ? { replyTo } : {}),
  });

const extractedMessage = await Collections.Message.findById(message._id)
  .populate("sender", "_id username fullName profilePic")
  .populate({
    path: "replyTo",
    select: "_id content sender type media createdAt",
    populate: {
      path: "sender",
      select: "_id username fullName profilePic",
    },
  });

  await Collections.ChatRoom.updateOne(
    { _id: room._id },
    {
      lastMessageMeta: {
        messageId: message._id,
        text: content,
        sender: senderId,
        createdAt: message.createdAt,
      },
    }
  );

  await Collections.ChatMember.updateMany(
    { roomId: room._id, userId: { $ne: senderId } },
    { $inc: { unreadCount: 1 } }
  );

  const receivers = await Collections.ChatMember.find({
    roomId: room._id,
  }).distinct("userId");


  let roomResponse: any = room.toObject();

  if (room.type === "dm") {
    const members = await Collections.ChatMember.aggregate([
      { $match: { roomId: room._id } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: "$user._id",
          username: "$user.username",
          fullName: "$user.fullName",
          email: "$user.email",
          profilePic: "$user.profilePic",
          unreadCount: 1,
          isMuted: 1,
          isArchived: 1,
          lastSeenAt: 1,
        },
      },
    ]);

    const presence = await RedisHelpers.getUsersOnlineStatus(
      members.map((m: any) => m._id.toString())
    );

    const presenceMap = new Map(
      presence.map((p: any) => [p.userId, p])
    );

    roomResponse = {
      ...roomResponse,
      unreadCount: 0,
      isMuted: false,
      isArchived: false,
      blockedMe: false,
      lastMessageMeta: {
        _id: extractedMessage?._id.toString(),
        senderId: extractedMessage?.sender?._id,
        createdAt: extractedMessage?.createdAt,
        text: extractedMessage?.content
      },
      participants: members.map((m: any) => {
        const p = presenceMap.get(m._id.toString());
        return {
          ...m,
          isOnline: p?.isOnline || false,
          lastActive: p?.lastActive
            ? new Date(Number(p.lastActive))
            : null,
          isBlocked: false,
        };
      }),
    };
  }

  return {
    room: roomResponse,
    message: extractedMessage,
    receivers,
    senderSocketId,
    tempId,
    toUserId:toUserId ? toUserId :null
  };
};

export const sendMedia = async (req: Request) => {
  const {
    senderId,
    roomId,
    toUserId,
    content,
    replyTo,
    tempId,
    effectiveRoomId,
    senderSocketId,
  } = req.body;

  if (!senderId) throw new ApiError(400, "Missing sender");

  const files = (req.files as { [fieldname: string]: Express.Multer.File[] })?.media;

  if (!files || files.length === 0) {
    throw new ApiError(400, "Missing media files");
  }

  let room: any = null;

  if (!roomId && toUserId) {
    const membersHash = [senderId, toUserId].sort().join("_");

    room = await Collections.ChatRoom.findOne({ type: "dm", membersHash });

    if (!room) {
      room = await Collections.ChatRoom.create({
        type: "dm",
        membersHash,
        createdBy: senderId,
        admins: [],
      });

      await Collections.ChatMember.insertMany([
        { roomId: room._id, userId: senderId },
        { roomId: room._id, userId: toUserId },
      ]);
    }
  } else {
    room = await Collections.ChatRoom.findById(roomId);
  }

  if (!room) throw new ApiError(404, "Room not found");

  const uploadedMedia = await Promise.all(
    files.map(async (file) => {
      const result = await uploadMediaCloudinary(file.path);
      return {
        url: result.secure_url,
        type: result.resource_type,
        thumbnail:
          result.resource_type === "video"
            ? getCloudinaryThumbnailFromUrl(result.secure_url)
            : result.secure_url,
        size: result.bytes,
        duration: result.duration || null,
      };
    })
  );

  const message = await Collections.Message.create({
    roomId: room._id,
    sender: senderId,
    type: uploadedMedia[0].type,
    content: content || "",
    status: "send",
    media: uploadedMedia,
    ...(replyTo ? { replyTo } : {}),
  });

  const lastUpdatetext =
    message.content ||
    `send ${message.media && message.media.length > 1
      ? `${message.media.length} ${message.media[0]?.type} and more`
      : `${message.media?.[0]?.type || message.type}`
    }`;

  await Collections.ChatRoom.updateOne(
    { _id: room._id },
    {
      lastMessageMeta: {
        messageId: message._id,
        text: lastUpdatetext,
        sender: senderId,
        createdAt: message.createdAt,
      },
    }
  );

  await Collections.ChatMember.updateMany(
    { roomId: room._id, userId: { $ne: senderId } },
    { $inc: { unreadCount: 1 } }
  );

  const receivers = await Collections.ChatMember.find({
    roomId: room._id,
  }).distinct("userId");

  const refreshedRoom = await Collections.ChatRoom.findById(room._id).lean();

const extractedMessage = await Collections.Message.findById(message._id)
  .populate("sender", "_id username fullName profilePic")
  .populate({
    path: "replyTo",
    select: "_id content sender type media createdAt",
    populate: {
      path: "sender",
      select: "_id username fullName profilePic",
    },
  });

  let roomResponse: any = refreshedRoom;

  if (refreshedRoom?.type === "dm") {
    const members = await Collections.ChatMember.aggregate([
      { $match: { roomId: refreshedRoom._id } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: "$user._id",
          username: "$user.username",
          fullName: "$user.fullName",
          email: "$user.email",
          profilePic: "$user.profilePic",
          unreadCount: 1,
          isMuted: 1,
          isArchived: 1,
          lastSeenAt: 1,
        },
      },
    ]);

    const presence = await RedisHelpers.getUsersOnlineStatus(
      members.map((m: any) => m._id.toString())
    );

    const presenceMap = new Map(
      presence.map((p: any) => [p.userId, p])
    );

    roomResponse = {
      ...roomResponse,
      unreadCount: 0,
      isMuted: false,
      isArchived: false,
      blockedMe: false,
      lastMessageMeta: {
        _id: extractedMessage?._id.toString(),
        senderId: extractedMessage?.sender?._id,
        createdAt: extractedMessage?.createdAt,
        text: lastUpdatetext,
      },
      participants: members.map((m: any) => {
        const p = presenceMap.get(m._id.toString());
        return {
          ...m,
          isOnline: p?.isOnline || false,
          lastActive: p?.lastActive
            ? new Date(Number(p.lastActive))
            : null,
          isBlocked: false,
        };
      }),
    };
  }

  await publishMessage(roomResponse?._id.toString(), {
    roomId: roomResponse?._id,
    room: roomResponse,
    message: extractedMessage,
    receivers,
    tempId,
    senderSocketId,
    effectiveRoomId,
    toUserId:toUserId ?toUserId:null
  });
};


export const getMessages = async (req: Request) => {
  const { roomId } = req.params;
  const { cursor, limit } = req.query;

  if (!roomId) {
    throw new ApiError(400, "Room ID is required");
  }

  const userId = req.identity;
  const limitNum = Number(limit) || 50;

 
  const andConditions: any[] = [{ roomId }];

  const member = await Collections.ChatMember.findOne({
    roomId,
    userId,
  })
    .select("clearChatAt")
    .lean();

  if (member?.clearChatAt) {
    andConditions.push({
      createdAt: { $gt: member.clearChatAt },
    });
  }

  if (cursor) {
    const cursorMsg = await Collections.Message.findById(cursor)
      .select("createdAt")
      .lean();

    if (!cursorMsg) {
      throw new ApiError(400, "Invalid cursor");
    }

    andConditions.push({
      $or: [
        { createdAt: { $lt: cursorMsg.createdAt } },
        {
          createdAt: cursorMsg.createdAt,
          _id: { $lt: cursorMsg._id },
        },
      ],
    });
  }

  const query =
    andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

  /**
   * -------------------------------------------------
   * Fetch messages (newest → oldest)
   * -------------------------------------------------
   */
  let messages = await Collections.Message.find(query)
    .sort({ createdAt: -1, _id: -1 }) // newest first (DB efficient)
    .limit(limitNum + 1) // extra one to detect hasMore
    .select(
      "_id roomId sender status content media type replyTo reactions isEdited isDeleted createdAt"
    )
    .populate("sender", "username fullName profilePic")
    .populate({
      path: "replyTo",
      select: "content sender media type createdAt",
      populate: {
        path: "sender",
        select: "username fullName profilePic",
      },
    })
    .lean();

  /**
   * -------------------------------------------------
   * Pagination handling
   * -------------------------------------------------
   */
  const hasMore = messages.length > limitNum;

  if (hasMore) {
    messages.pop(); // remove extra message
  }

  // 🔥 Cursor = OLDEST message of current batch
  const nextCursor =
    hasMore && messages.length > 0
      ? messages[messages.length - 1]._id
      : null;

  /**
   * -------------------------------------------------
   * Return messages in chronological order
   * (oldest → newest)
   * -------------------------------------------------
   */
  messages.reverse();

  return {
    message: "Fetched messages",
    messages,
    nextCursor,
    hasMore,
    noMoreMessages: !hasMore,
  };
};



export const chatRooms = async (req: Request) => {
  const { id, cursor } = req.query;
  if (!id) throw new ApiError(403, "User ID not provided.");

  const userId = new mongoose.Types.ObjectId(String(id));
  const limit = 10;

  const cursorDate = cursor ? new Date(String(cursor)) : null;

  const pipeline: any[] = [
    { $match: { userId } },

    {
      $lookup: {
        from: "chatrooms",
        localField: "roomId",
        foreignField: "_id",
        as: "room",
      },
    },
    { $unwind: "$room" },

    {
      $match: {
        "room.lastMessageMeta.text": { $exists: true, $ne: "" },
        ...(cursorDate && {
          "room.lastMessageMeta.createdAt": { $lt: cursorDate },
        }),
      },
    },

    {
      $lookup: {
        from: "chatmembers",
        localField: "roomId",
        foreignField: "roomId",
        as: "members",
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "members.userId",
        foreignField: "_id",
        as: "users",
      },
    },

    {
      $project: {
        _id: "$room._id",
        type: "$room.type",
        name: "$room.name",
        avatar: "$room.avatar",
        description: "$room.description",
        admins: "$room.admins",
        createdBy: "$room.createdBy",
        status: "$room.status",
        lastMessageMeta: "$room.lastMessageMeta",

        unreadCount: "$unreadCount",
        isMuted: "$isMuted",
        isArchived: "$isArchived",

        participants: {
          $map: {
            input: "$members",
            as: "m",
            in: {
              _id: "$$m.userId",
              unreadCount: "$$m.unreadCount",
              isMuted: "$$m.isMuted",
              isArchived: "$$m.isArchived",
              user: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$users",
                      as: "u",
                      cond: { $eq: ["$$u._id", "$$m.userId"] },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      },
    },

    {
      $addFields: {
        participants: {
          $map: {
            input: "$participants",
            as: "p",
            in: {
              _id: "$$p._id",
              username: "$$p.user.username",
              fullName: "$$p.user.fullName",
              profilePic: "$$p.user.profilePic",
              email: "$$p.user.email",
              unreadCount: "$$p.unreadCount",
              isMuted: "$$p.isMuted",
              isArchived: "$$p.isArchived",
              lastActive: "$$p.user.lastActive",
            },
          },
        },
      },
    },

    { $sort: { "lastMessageMeta.createdAt": -1 } },
    { $limit: limit + 1 },
  ];

  const rooms = await Collections.ChatMember.aggregate(pipeline);

  const hasNext = rooms.length > limit;
  const slicedRooms = hasNext ? rooms.slice(0, limit) : rooms;

  const nextCursor = hasNext
    ? slicedRooms[slicedRooms.length - 1]?.lastMessageMeta?.createdAt
    : null;

  const [blockedByMe, blockedMe] = await Promise.all([
    Collections.BlockModel.find(
      { blocker: userId },
      { blocked: 1 }
    ).lean(),
    Collections.BlockModel.find(
      { blocked: userId },
      { blocker: 1 }
    ).lean(),
  ]);

  const blockedByMeSet = new Set(blockedByMe.map((b) => b.blocked.toString()));
  const blockedMeSet = new Set(blockedMe.map((b) => b.blocker.toString()));

  const allParticipantIds = slicedRooms.flatMap((room: any) =>
    room.participants.map((p: any) => p._id.toString())
  );

  const presenceData =
    await RedisHelpers.getUsersOnlineStatus(allParticipantIds);

  const presenceMap = new Map(
    presenceData.map((u: any) => [u.userId, u])
  );

  const enrichedRooms = slicedRooms.map((room: any) => {
    const blockedMeInRoom = room.participants.some(
      (p: any) =>
        blockedMeSet.has(p._id.toString()) &&
        p._id.toString() !== userId.toString()
    );

    return {
      ...room,
      blockedMe: blockedMeInRoom,
      participants: room.participants.map((p: any) => {
        const presence = presenceMap.get(p._id.toString());

        const isBlocked =
          room.type === "dm" &&
          blockedByMeSet.has(p._id.toString()) &&
          p._id.toString() !== userId.toString();

        return {
          ...p,
          isOnline: presence?.isOnline ?? false,
          lastActive: presence?.isOnline
            ? null
            : presence?.lastActive
              ? new Date(Number(presence.lastActive))
              : p.lastActive ?? null,
          isBlocked,
        };
      }),
    };
  });

  return {
    data: enrichedRooms,
    nextCursor,
    hasNext,
  };
};

export const unsendMessage = async ({
  messageId,
  roomId,
  userId,
}: {
  messageId: string;
  roomId: string;
  userId: string;
}) => {
  if (!messageId || !roomId || !userId) {
    throw new ApiError(400, "Missing required fields.");
  }

  const message = await Collections.Message.findOne({
    _id: messageId,
    roomId,
    sender: userId,
    isDeleted: false,
  });

  if (!message) {
    throw new ApiError(404, "Message not found or already deleted.");
  }

  // delete media
  if (Array.isArray(message.media) && message.media.length > 0) {
    await Promise.all(
      message.media.map((m) =>
        m?.url ? deleteFromCloudinary(m.url) : Promise.resolve()
      )
    );
  }

  const deletedText = "This message was removed or is no longer accessible.";

  const updatedMessage = await Collections.Message.findByIdAndUpdate(
    messageId,
    {
      $set: {
        isDeleted: true,
        content: deletedText,
        media: [],
        isEdited: false,
      },
    },
    { new: true }
  ).lean();

  const room = await Collections.ChatRoom.findById(roomId).lean();

  const isLastMessage =
    room?.lastMessageMeta?.messageId?.toString() === messageId;
let roomLastMessage
if (isLastMessage) {
    roomLastMessage = await Collections.ChatRoom.findByIdAndUpdate(
      roomId,
      {
        $set: {
          "lastMessageMeta.text": deletedText,
        },
      },
      { new: true } 
    ).lean();
  }

  return {
    room:roomLastMessage,
    message: updatedMessage,
    shouldUpdateLastMessage: isLastMessage, 
  };
};

export const editMessage = async ({
  messageId,
  roomId,
  newContent,
  userId,
}: {
  messageId: string;
  roomId: string;
  newContent: string;
  userId: string;
}) => {
  if (!messageId || !roomId || !newContent) {
    throw new Error("Missing required fields");
  }

  const updatedMessage = await Collections.Message.findOneAndUpdate(
    {
      _id: messageId,
      roomId,
      sender: userId,
      isDeleted: false,
      type: "text",
    },
    {
      $set: {
        content: newContent,
        isEdited: true,
      },
    },
    { new: true }
  )
    .populate("sender", "_id username fullName profilePic")
    .populate({
      path: "replyTo",
      select: "_id content sender type media createdAt",
      populate: {
        path: "sender",
        select: "_id username fullName profilePic",
      },
    })
    .lean();

  if (!updatedMessage) {
    throw new Error("Message not found or cannot be edited");
  }

  const room = await Collections.ChatRoom.findById(roomId).lean()

  if (!room) throw new Error("Room not found");

  const isLastMessage = room.lastMessageMeta?.messageId?.toString() === updatedMessage._id.toString();
let roomLastMessage
if (isLastMessage) {
    roomLastMessage = await Collections.ChatRoom.findByIdAndUpdate(
      roomId,
      {
        $set: {
          "lastMessageMeta.text": updatedMessage?.content,
        },
      },
      { new: true } 
    ).lean();
  }


  return {
    message:updatedMessage,
    shouldUpdateLastMessage: isLastMessage,
    room:roomLastMessage 
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
      _id: roomId,
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

  console.log("room: ", room);

  if (!room) {
    throw new Error(
      "Message request cannot be accepted. Either the room doesn't exist, is not pending, or this user is not allowed to accept."
    );
  }

  return room;
};
