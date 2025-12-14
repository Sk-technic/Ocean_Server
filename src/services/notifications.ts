import { Request } from "express";
import { Collections } from "../models";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";

const PAGE_SIZE = 20;

export const getNotifications = async (req: Request) => {
    const userId = req.params.Id;
    const cursor = req.query.cursor as string | undefined;

    const matchFilter: any = {
        user: new mongoose.Types.ObjectId(userId)
    };

    if (cursor) {
        matchFilter.createdAt = { $lt: new Date(cursor) };
    }

    const notifications = await Collections.NotificationModel.aggregate([
        { $match: matchFilter },
        { $sort: { createdAt: -1 } },
        { $limit: PAGE_SIZE },

        {
            $lookup: {
                from: "users",
                localField: "actor",
                foreignField: "_id",
                as: "actorData",
                pipeline: [
                    { $project: { username: 1, profilePic: 1 } }
                ]
            }
        },

        {
            $addFields: {
                actor: {
                    _id: "$actor",
                    username: { $arrayElemAt: ["$actorData.username", 0] },
                    profilePic: { $arrayElemAt: ["$actorData.profilePic", 0] }
                },
                unreadCountPerNotification: {
                    $cond: [{ $eq: ["$isRead", false] }, 1, 0]
                }
            }
        },

        { $project: { actorData: 0 } }
    ]);


    const nextCursor = notifications.length
        ? notifications[notifications.length - 1].createdAt
        : null;

    const unreadCount = await Collections.NotificationModel.countDocuments({
        user: userId,
        isRead: false
    });

    const response = {
        notifications,
        nextCursor,
        unreadCount,
        cached: false
    };

    return response;
};

export const markNotificationsAsRead = async (req: Request) => {
  const userId = req.params.id;

  if (!userId) {
    throw new ApiError(400, "User ID missing");
  }

const result =  await Collections.NotificationModel.updateMany(
    { user: userId, isRead: false },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  return result.modifiedCount;
};

