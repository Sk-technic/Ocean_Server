import { Request } from "express";
import { FileDictionary } from "../interfaces/files.interface";
import { Collections } from "../models";
import { optimizeCloudinaryUrl, uploadToCloudinary } from "../utils/cloudinary";
import { ApiError } from "../utils/ApiError"; // Assuming this exists
import { IUpdateUser } from "../interfaces/user.Interface";
import { RedisHelpers } from "../utils/redisHelper";
import mongoose from "mongoose";

export const EditCoverImage = async (req: Request) => {
  const files = req.files as FileDictionary | undefined;

  if (!req.identity) {
    throw new ApiError(401, "Unauthorized: user identity missing");
  }

  if (!files || !files.coverImage?.[0]?.path) {
    throw new ApiError(400, "No cover image file provided");
  }

  const coverImagePath = files.coverImage[0].path;

  // Upload to Cloudinary
  const uploadResult = await uploadToCloudinary(coverImagePath);

  if (!uploadResult?.url) {
    throw new ApiError(500, "Failed to upload cover image to Cloudinary");
  }

  // Update user in database
  const updatedUser = await Collections.UserModel.findByIdAndUpdate(
    req.identity,
    { coverImage: uploadResult.url },
    { new: true, runValidators: true }
  ).select("-password");

  if (!updatedUser) {
    throw new ApiError(404, "User not found or update failed");
  }
};

export const EditProfileImage = async (req: Request) => {
  const files = req.files as FileDictionary | undefined;

  if (!req.identity) {
    throw new ApiError(401, "Unauthorized: user identity missing");
  }
  console.log("filess", files);


  if (!files || !files.profilepic?.[0]?.path) {
    throw new ApiError(400, "No profile image file provided");
  }

  const profilePicPath = files.profilepic[0].path;

  // Upload to Cloudinary
  const uploadResult = await uploadToCloudinary(profilePicPath);

  if (!uploadResult?.url) {
    throw new ApiError(500, "Failed to upload cover image to Cloudinary");
  }

  // Update user in database
  const updatedUser = await Collections.UserModel.findByIdAndUpdate(
    req.identity,
    { profilePic: uploadResult.url },
    { new: true, runValidators: true }
  ).select("-password");

  if (!updatedUser) {
    throw new ApiError(404, "User not found or update failed");
  }

};


export const DeleteProfileImage = async (req: Request) => {

  const updatedUser = await Collections.UserModel.findByIdAndUpdate(
    { _id: req.identity, profilePic: { $ne: null } },
    { profilePic: null },
    { new: true, runValidators: true }
  ).select("-password");
  if (!updatedUser) {
    throw new ApiError(404, "User not found or update failed");
  }
  return updatedUser;
};

export const DeleteCoverImage = async (req: Request) => {

  const updatedUser = await Collections.UserModel.findByIdAndUpdate(
    { _id: req?.identity, coverImage: { $ne: null } },
    { coverImage: null },
    { new: true, runValidators: true }
  ).select("-password");
  if (!updatedUser) {
    throw new ApiError(404, "User not found or update failed");
  }
  return updatedUser;

};

const allowedPlatforms = ["instagram", "facebook", "discord", "twitter", "youtube", "threads", "telegram"];

// Regular expressions for each platform
const urlPatterns: Record<string, RegExp> = {
  instagram: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._-]+\/?$/,
  facebook: /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._-]+\/?$/,
  discord: /^https?:\/\/(www\.)?discord\.com\/[a-zA-Z0-9._/-]+\/?$/,
  twitter: /^https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9._-]+\/?$/,
  youtube: /^https?:\/\/(www\.)?youtube\.com\/[a-zA-Z0-9._/-]+\/?$/,
  threads: /^https?:\/\/(www\.)?threads\.net\/[a-zA-Z0-9._/-]+\/?$/,
  telegram: /^https?:\/\/(www\.)?t\.me\/[a-zA-Z0-9_-]+\/?$/,
};

export const UpdateProfile = async (req: Request) => {
  const body: IUpdateUser = req.body;

  if (body.bio) {
    const bioText = body.bio.trim();

    // --- Count words ---
    const words = bioText.split(/\s+/).filter(Boolean);
    if (words.length > 150) {
      throw new ApiError(400, `Bio cannot exceed 150 words. Current: ${words.length}`);
    }

    // --- Count characters including spaces ---
    const charCount = bioText.length;
    if (charCount > 150) { // example limit, change as needed
      throw new ApiError(400, `Bio cannot exceed 150 characters. Current: ${charCount}`);
    }
  }



  // --- Validate phone number if provided ---
  if (body.phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 international format
    if (!phoneRegex.test(body.phone)) {
      throw new ApiError(400, "Invalid phone number format");
    }
  }

  // --- Validate social links ---
  if (body.socialLinks) {
    for (const [platform, link] of Object.entries(body.socialLinks)) {
      if (!allowedPlatforms.includes(platform)) {
        throw new ApiError(400, `Invalid platform: ${platform}`);
      }

      const pattern = urlPatterns[platform];
      if (!pattern.test(link)) {
        throw new ApiError(400, `Invalid URL format for ${platform}`);
      }
    }
  }

  // --- Build update object with allowed fields ---
  const updateData: Partial<IUpdateUser> = {
    username: body.username,
    firstName: body.firstName,
    lastName: body.lastName,
    phone: body.phone || null,
    bio: body.bio || null,
    socialLinks: body.socialLinks || null,
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(
    (key) => updateData[key as keyof IUpdateUser] === undefined && delete updateData[key as keyof IUpdateUser]
  );

  // --- Update user in DB ---
  const updatedUser = await Collections.UserModel.findByIdAndUpdate(
    req.identity,
    updateData,
    { new: true, runValidators: true }
  ).select("-password");

  if (!updatedUser) {
    throw new ApiError(404, "User not found or update failed");
  }

  return updatedUser;
};

export const SearchQuery = async (req: Request) => {
  const query = req.params.query;
  if (!query) throw new ApiError(404, "Query missing.");

  const searchTerm = query.toLowerCase().trim();
  const escapedQuery = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const loggedinUserName = req.User.username;
  const loggedinFullName = req.User.fullName;
  const loggedinFirstName = req.User.fullName?.split(" ")[0];
  const loggedinLastName = req.User.fullName?.split(" ")[1];

  const users = await Collections.UserModel.aggregate([
    // MATCH USERS
    {
      $match: {
        $and: [
          { isDeleted: false },
          { status: "active" },
          {
            $or: [
              {
                $and: [
                  { username: { $regex: `^${escapedQuery}`, $options: "i" } },
                  { username: { $ne: loggedinUserName } },
                ],
              },
              {
                $and: [
                  { firstName: { $regex: escapedQuery, $options: "i" } },
                  { firstName: { $ne: loggedinFirstName } },
                ],
              },
              {
                $and: [
                  { lastName: { $regex: escapedQuery, $options: "i" } },
                  { lastName: { $ne: loggedinLastName } },
                ],
              },
              {
                $and: [
                  { fullName: { $regex: escapedQuery, $options: "i" } },
                  { fullName: { $ne: loggedinFullName } },
                ],
              },
            ],
          },
        ],
      },
    },

    // RELEVANCE SCORE
    {
      $addFields: {
        relevanceScore: {
          $cond: [
            { $eq: ["$username", searchTerm] },
            100,
            {
              $cond: [
                { $regexMatch: { input: "$username", regex: `^${searchTerm}`, options: "i" } },
                90,
                {
                  $cond: [
                    { $regexMatch: { input: "$username", regex: searchTerm, options: "i" } },
                    80,
                    {
                      $cond: [
                        { $regexMatch: { input: "$firstName", regex: searchTerm, options: "i" } },
                        60,
                        {
                          $cond: [
                            { $regexMatch: { input: "$lastName", regex: searchTerm, options: "i" } },
                            40,
                            20,
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    },

    // PROJECT FIELDS
    {
      $project: {
        username: 1,
        fullName: 1,
        firstName: 1,
        lastName: 1,
        profilePic: 1,
        bio: 1,
        isActive: 1,
        followersCount: 1,
        followingCount: 1,
        postCount: 1,
        isVerified: 1,
        isemailVerified: 1,
        isPrivate: 1,
        relevanceScore: 1,
        socialLinks:1
      },
    },

    {
      $lookup: {
        from: "follows",
        let: { searchedUserId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$follower", new mongoose.Types.ObjectId(req.identity)] },
                  { $eq: ["$following", "$$searchedUserId"] },
                ],
              },
            },
          },
          {
            $project: {
              _id: 0,
              status: 1,
            },
          },
        ],
        as: "followInfo",
      },
    },

    {
      $unwind: {
        path: "$followInfo",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $addFields: {
        followStatus: {
          $cond: [
            { $eq: ["$followInfo", null] },
            "$$REMOVE",     // remove the field entirely
            "$followInfo.status"
          ]
        }
      }
    },

    {
      $project: {
        followInfo: 0,
      },
    },

    // SORT + LIMIT
    { $sort: { relevanceScore: -1, followersCount: -1 } },
    { $limit: 25 },
  ]);

  // Optimize Cloudinary images
  const optimizedUsers = users.map((user) => ({
    ...user,
    profilePic: optimizeCloudinaryUrl(user.profilePic, 200, 200),
  }));

  return optimizedUsers;
};

export const GetUser = async (req: Request) => {
  const { roomId } = req.params;
  const loggedInUserId = req.identity

  if (!roomId) throw new ApiError(403, "Room ID not provided");

  const cacheKey = `room:user:${roomId}:${loggedInUserId}`;

  const cached = await RedisHelpers.getUser(cacheKey);
  if (cached) {
    console.log("Cache hit:", cacheKey);
    return cached
  }

  console.log("💾 Cache miss — fetching from DB...");

  const room = await Collections.ChatRoom.findById(roomId)
    .populate({
      path: "participants",
      select: "_id firstName lastName username profileImage bio",
    })
    .lean();

  if (!room) throw new ApiError(404, "Room not found");
  const filterUser = room.participants.filter(
    (p) => p?.user.toString() !== loggedInUserId.toString()
  );

  if (!filterUser) throw new ApiError(404, "Other user not found in room");

  await RedisHelpers.setUser(cacheKey, JSON.stringify(filterUser), 60 * 10);

  return filterUser;
};

export const SetOnline = async (userId: string) => {
  const user = await Collections.UserModel.findByIdAndUpdate(
    userId,
    {
      isActive: "online",
      lastSeen: new Date()
    },
    { new: true }
  );

  if (!user) throw new Error("User not found");

  return user;
};

export const SetAway = async (userId: string) => {
  const user = await Collections.UserModel.findByIdAndUpdate(
    userId,
    {
      isActive: "away",
      lastSeen: new Date()
    },
    { new: true }
  );

  if (!user) throw new Error("User not found");

  return user;
};

export const updateLastActive = async (userId: string, isOnline: boolean) => {
  await Collections.UserModel.findByIdAndUpdate(
    userId,
    { lastActive: isOnline ? null : new Date() },
    { new: true }
  );
};

export const AccountPrivacy = async (req: Request) => {
  const userId = req.params.userId;
  const key = req.query.key as string;
  if (!userId || userId.toString() === req.identity) {
    throw new ApiError(400, "user not matched");
  }
  const isPrivateValue = Boolean(Number(key));

  const result = await Collections.UserModel.findOneAndUpdate(
    {
      _id: userId,
      isPrivate: { $ne: isPrivateValue }
    },
    {
      isPrivate: isPrivateValue
    },
    {
      new: true
    }
  );
  const updatedUser = {
    _id: result?._id,
    isPrivate: result?.isPrivate
  }
  return updatedUser;
};

export const BlockUser = async (req: Request) => {
  const blockedUser = req.params.blockedUser;

  if (!blockedUser) {
    throw new ApiError(400, "User ID missing.");
  }

  if (!mongoose.Types.ObjectId.isValid(blockedUser)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  if (req.identity.toString() === blockedUser) {
    throw new ApiError(400, "You cannot block yourself.");
  }

  const userExists = await Collections.UserModel.exists({
    _id: blockedUser,
    isDeleted: false,
  });

  if (!userExists) {
    throw new ApiError(404, "User not found.");
  }

    await Collections.BlockModel.create({
      blocker: req.identity,
      blocked: blockedUser,
    });

    return {
      message: "User blocked successfully.",
      alreadyBlocked: false,
    };
};

export const GetBlockedUsers = async (req: Request) => {
  const blockerId = req.identity;
  const cursor = req.query.cursor as string | undefined;
  const limit = 8;

  const query: any = {
    blocker: blockerId,
  };

  if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
    query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  const blockedUsers = await Collections.BlockModel.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate({
      path: "blocked",
      select: "username fullName profilePic bio",
    }).select("-__v");

  let nextCursor: string | null = null;

  if (blockedUsers.length > limit) {
    const nextItem = blockedUsers.pop();
    nextCursor = nextItem?._id.toString() || null;
  }

  return {
    data: blockedUsers,
    nextCursor,
  };
};

export const UnBlockUser = async (req: Request) => {
  const blockedUser = req.params.blockedUser;
  const blockerId = req.identity;

  if (!blockerId || !blockedUser) {
    throw new ApiError(400, "User ID missing.");
  }

  if (!mongoose.Types.ObjectId.isValid(blockedUser)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  if (blockerId.toString() === blockedUser) {
    throw new ApiError(400, "You cannot unblock yourself.");
  }

  const result = await Collections.BlockModel.findOneAndDelete({
    blocker: blockerId,
    blocked: blockedUser,
  });

  if (!result) {
    throw new ApiError(404, "User is not blocked.");
  }

  return result?.blocked.toString();
};
