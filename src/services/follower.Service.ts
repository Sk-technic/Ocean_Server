import { Request } from "express";
import { Collections } from "../models";
import { ApiError } from "../utils/ApiError";
import mongoose from "mongoose";
import { publishNotification } from "../events/redis/notification.Pub";


export const sendFollow = async (req: Request) => {
    const followerId = req.identity;   // Who is following
    const targetId = req.params.id;    // Who gets followed

    if (!followerId || !targetId) throw new ApiError(400, "Missing required fields");

    if (followerId === targetId) {
        throw new ApiError(400, "You cannot follow yourself");
    }

    const targetUser = await Collections.UserModel.findById(targetId)
        .select("isPrivate")
        .lean();

    const isblocked = await Collections.BlockModel.findOne({
        blocker: targetId,
        blocked: followerId
    });

    if (isblocked) {
        throw new ApiError(403, "You have been blocked by this user");
    }

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
        if (existing.status == "blocked") throw new ApiError(400, "you can't follow this user.")
        throw new ApiError(400, "Already followed or follow request pending");
    }

    const isPrivate = targetUser.isPrivate;
    const status = isPrivate ? "requested" : "accepted";

    // Create follow relation
    const follow = await Collections.FollowModel.create({
        follower: followerId,
        following: targetId,
        status,
    });

    // Increase counters only when follow is accepted
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


    const notification = await Collections.NotificationModel.create({
        user: targetId,                 // receiver
        actor: followerUser?._id,       // sender
        type: isPrivate ? "follow-request" : "follow",
        message: isPrivate
            ? `sent you a follow request`
            : `started following you`,
        postId: null,
        isRead: false,
        createdAt: new Date()
    });


    const unreadCount = await Collections.NotificationModel.countDocuments({
        user: targetId,
        isRead: false,
    });

    // ============================================
    // SEND REAL-TIME NOTIFICATION THROUGH REDIS
    // ============================================
    await publishNotification(`notification:${targetId}`, {
        event: isPrivate ? "follow-request" : "follow",
        user: targetId,
        notification: {
            _id: notification._id,
            actor: {
                _id: followerUser?._id,
                username: followerUser?.username,
                profilePic: followerUser?.profilePic
            },
            type: notification.type,
            message: notification.message,
            isRead: false,
            createdAt: notification.createdAt
        },
        unreadCount
    });

    return {
        message: isPrivate ? "Follow request sent" : "Followed successfully",
        follow,
        notification
    };
};

export const acceptRequest = async (req: Request) => {
    const targetId: string = req.identity;     // jisko request aayi
    const requesterId: string = req.body.userId     // jisne request bheji
    const notificationId: string = req.body.notificationId
    console.log("notificationId", notificationId);

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
            _id: new mongoose.Types.ObjectId(notificationId),
        },
        {
            $set: {
                type: "follow",
            },
        },
        { new: true }
    );

    console.log("updated noti", noti);

    return follow
}

export const rejectRequest = async (req: Request) => {
    const targetId = req.identity;
    const requesterId = req.body.userId;
    const notificationId: string = req.body.notificationId

    const follow = await Collections.FollowModel.findOneAndDelete({
        follower: requesterId,
        following: targetId,
        status: "requested"
    });

    await Collections.NotificationModel.findOneAndDelete(
        {
            user: targetId,
            _id: notificationId,
        },
        { new: true }
    );



    if (!follow) throw new ApiError(400, "No follow request found");

    return true;
};

export const unfollowUser = async (req: Request) => {
    const followerId = req.identity;
    const targetId = req.params.id;

    if (!followerId || !targetId) {
        throw new ApiError(400, "User ID missing");
    }

    const found = await Collections.FollowModel.findOneAndDelete({
        follower: followerId,
        following: targetId,
        status: "accepted",
    });

    if (!found) {
        throw new ApiError(400, "You are not following this user");
    }

    await Collections.UserModel.updateOne(
        { _id: followerId },
        { $inc: { followingCount: -1 } }
    );
    await Collections.UserModel.updateOne(
        { _id: targetId },
        { $inc: { followersCount: -1 } }
    );


    return {
        message: "Unfollowed successfully",
    };
};

export const blockReq = async (req: Request) => {
    const blockerId = req.identity;
    const targetId = req.params.id;

    const follow = await Collections.FollowModel.findOne({
        follower: targetId,
        following: blockerId,
        status: "requested"
    });

    if (!follow) throw new ApiError(400, "Follow request not found");

    const updated = await Collections.FollowModel.findOneAndUpdate(
        {
            _id: follow._id,
        },
        {
            status: "blocked",
            actionBy: blockerId,
        },
        { new: true }
    );

    await Collections.NotificationModel.findOneAndDelete({ actor: targetId })

    return updated;
};

export const unblockReq = async (req: Request) => {
    const blockerId = req.identity;
    const targetId = req.params.id;
    console.log(targetId, blockerId);


    const follow = await Collections.FollowModel.findOneAndDelete({
        follower: targetId,
        following: blockerId,
        status: "blocked"
    });

    if (!follow) throw new ApiError(400, "User not blocked");

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

export const GetMuteUsers = async (req: Request) => {
    const userId = req.identity;

    const cursor = req.query.cursor as string | undefined;

    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const query: any = {
        following: userId,
        status: "blocked",
    };

    if (cursor) {
        query._id = { $lt: cursor };
    }

    const records = await Collections.FollowModel.find(query)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .populate("follower", "_id username fullName profilePic");

    let nextCursor = null;

    if (records.length > limit) {
        nextCursor = records[limit]._id;
        records.splice(limit, 1);
    }

    return {
        data: records,
        nextCursor,
    };
};

