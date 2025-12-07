import { Document, Types } from 'mongoose';

export interface IUser extends Document {
    _id:string;
    username: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    isDeleted: boolean;
    phone?: String | null;
    passwordHash: string | null;  // renaming for clarity
    isPrivate:boolean;
    profilePic?: string;
    bio?: string;
    isActive?: 'online' | 'offline' | 'away';
    isOtpVerified:boolean;
    coverImage?: string;
    status: 'active' | 'banned' | 'suspended';
    lastActive: Date | null;
    subscriptionStartedAt?: Date;
    subscriptionExpiresAt?: Date;
    subscriptionStatus?: string;
    subscriptionPlanId?: Types.ObjectId;
    language: string;
    reportedUsers?: Types.ObjectId[];
    blockedUsers?: Types.ObjectId[];
    isVerified: boolean;
    isemailVerified: boolean;
    isphoneVerified: boolean;
    GoogleId?: String;
    recoveryEmail?:String;
    reelsCount?: number;
    videosCount?: number;
    postCount?: number;
    followersCount?: number;
    followingCount?: number;
    lastLogin: Date;
    watchHistory?: Types.ObjectId[];
    subscribedCount?: number;
    subscriptionsCount?: number;
    socialLinks?: Record<string, string>;
    notificationPrefs?: Record<string, any>;
    privacySettings?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    refreshToken: string | null;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
    isOTPCorrect(Token:string) : Promise<boolean>;
}

export interface IUpdateUser {
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    bio?: string | null;
    socialLinks?: Record<string, string> | null;
}