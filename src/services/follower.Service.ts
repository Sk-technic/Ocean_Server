import { Request } from "express";
import { Collections } from "../models";
import { ApiError } from "../utils/ApiError";
import mongoose from "mongoose";
import { publishNotification } from "../events/redis/notification.Pub";

export const sendFollow = async (req: Request) => {
    const followerId = req.identity;   // jo follow kar raha hai
    const targetId = req.params.id;    // jise follow kar raha hai

    if (!followerId || !targetId) throw new ApiError(400, "Missing required fields");

    if (followerId === targetId) {
        throw new ApiError(400, "You cannot follow yourself");
    }

    const targetUser = await Collections.UserModel.findById(targetId)
        .select("isPrivate blockedUsers")
        .lean();

    if (!targetUser) throw new ApiError(404, "User not found");

    // Check if A blocked by B
    if (targetUser.blockedUsers?.includes(new mongoose.Types.ObjectId(followerId))) {
        throw new ApiError(403, "You have been blocked by this user");
    }

    const followerUser = await Collections.UserModel.findById(followerId)
        .select("blockedUsers username fullName profilePic")
        .lean();

    // Check if A has blocked B
    if (followerUser?.blockedUsers?.includes(new mongoose.Types.ObjectId(targetId))) {
        throw new ApiError(403, "You have blocked this user");
    }

    const existing = await Collections.FollowModel.findOne({
        follower: followerId,
        following: targetId,
    });

    if (existing) {
        throw new ApiError(400, "Already followed or follow request pending");
    }

    const isPrivate = targetUser.isPrivate;
    const status = isPrivate ? "requested" : "accepted";

    const follow = await Collections.FollowModel.create({
        follower: followerId,
        following: targetId,
        status,
    });

    // Only increase counters for ACCEPTED follow
    if (!isPrivate) {
        await Collections.UserModel.updateOne(
            { _id: followerId },
            { $inc: { followingCount: 1 } }
        );
        await Collections.UserModel.updateOne(
            { _id: targetId },
            { $inc: { followersCount: 1 } }
        );
    }

    // =============================
    // CREATE NOTIFICATION PAYLOAD
    // =============================
    const notificationDoc = {
        type: isPrivate ? "follow-request" : "follow",
        fromUser: {
            _id: followerUser?._id,
            username: followerUser?.username,
            fullName: followerUser?.fullName,
            profilePic: followerUser?.profilePic,
        },
        text: isPrivate
            ? `${followerUser?.fullName} sent you a follow request`
            : `${followerUser?.fullName} started following you`,
        isRead: false,
        createdAt: new Date(),
        _id: new mongoose.Types.ObjectId() // assign fresh ID NOW
    };

    // =============================
    // UPSERT INTO NOTIFICATION MODEL
    // =============================
    const updated = await Collections.NotificationModel.findOneAndUpdate(
        { user: targetId },
        {
            $push: {
                notifications: {
                    $each: [notificationDoc],
                    $position: 0,
                },
            },
            $inc: { unreadCount: 1 },
        },
        { new: true, upsert: true }
    ).lean();

    const unreadCount = updated?.unreadCount;

    // =============================
    // PUBLISH THROUGH REDIS
    // =============================
    await publishNotification(`notification:${targetId}`, {
        event: isPrivate ? "follow-request" : "follow",
        user: targetId,
        notification: notificationDoc, // ALREADY HAS _id
        unreadCount
    });

    return {
        message: isPrivate ? "Follow request sent" : "Followed successfully",
        follow,
        notification: notificationDoc
    };
};


export const acceptRequest = async (req: Request) => {
    const targetId:string = req.identity;     // jisko request aayi
    const requesterId:string = req.body.userId     // jisne request bheji
    const notificationId :string = req.body.notificationId
    console.log("notificationId",notificationId);
    
    const follow = await Collections.FollowModel.findOne({
        follower: requesterId,
        following: targetId,
        status: "requested"
    });

    if (!follow) throw new ApiError(400, "No follow request found");

    follow.status = "accepted";
    follow.actionBy = new mongoose.Types.ObjectId(targetId);

    await follow.save();

    await Collections.UserModel.updateOne(
        { _id: requesterId },
        { $inc: { followingCount: 1 } }
    );
    await Collections.UserModel.updateOne(
        { _id: targetId },
        { $inc: { followersCount: 1 } }
    );

    const noti = await Collections.NotificationModel.findOneAndUpdate(
  {
    user: targetId,
    "notifications._id": new mongoose.Types.ObjectId(notificationId),
  },
  {
    $set: {
      "notifications.$.type": "follow",
    },
  },
  { new: true }
);

console.log("updated noti", noti);

    return follow
}

export const rejectRequest = async (req: Request) => {
    const targetId = req.identity;
    const requesterId = req.params.id;

    const follow = await Collections.FollowModel.findOneAndDelete({
        follower: requesterId,
        following: targetId,
        status: "requested"
    });

    if (!follow) throw new ApiError(400, "No follow request found");

    return true;
};

export const unfollowUser = async (req: Request) => {
    const followerId = req.identity;
    const targetId = req.params.id;

    const found = await Collections.FollowModel.findOneAndDelete({
        follower: followerId,
        following: targetId,
        status: "accepted"
    });

    if (!found) throw new ApiError(400, "You are not following this user");

    return true
};

export const blockUser = async (req: Request) => {
    const blockerId = req.identity;
    const targetId = req.params.id;

    let follow = await Collections.FollowModel.findOne({
        follower: blockerId,
        following: targetId
    });

    if (!follow) {
        follow = await Collections.FollowModel.create({
            follower: blockerId,
            following: targetId,
            status: "blocked",
            actionBy: blockerId
        });
    } else {
        follow.status = "blocked";
        follow.actionBy = new mongoose.Types.ObjectId(blockerId);
        await follow.save();
    }
    return follow;
};

export const unblockUser = async (req: Request) => {
    const blockerId = req.identity;
    const targetId = req.params.id;

    const follow = await Collections.FollowModel.findOne({
        follower: blockerId,
        following: targetId,
        status: "blocked"
    });

    if (!follow) throw new ApiError(400, "User not blocked");

    // delete block entry
    await follow.deleteOne();

    return true;
};

export const getFollowers = async (req: Request) => {
    const userId = req.params.id;

    const followers = await Collections.FollowModel
        .find({ following: userId, status: "accepted" })
        .populate("follower", "name username avatar");

    return followers;
};

export const getFollowing = async (req: Request) => {
    const userId = req.params.id;

    const following = await Collections.FollowModel
        .find({ follower: userId, status: "accepted" })
        .populate("following", "name username avatar");

    return following;
};

export const getMutual = async (req: Request) => {
    const userId = req.identity;
    const targetId = req.params.id;

    const meFollowing = await Collections.FollowModel.exists({
        follower: userId,
        following: targetId,
        status: "accepted"
    });

    const theyFollowing = await Collections.FollowModel.exists({
        follower: targetId,
        following: userId,
        status: "accepted"
    });

    return { isMutual: meFollowing && theyFollowing };
};
