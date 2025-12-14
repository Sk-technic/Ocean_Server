import { addRecoveryEmail, autoLogin, changePassword, getUser, googleAuth, googleCallback, logout, RefreshAccessToken, resendOTP, resetPassword, sendEmailVerification, signIn, signup, verifyOtp } from "./auth.Controllers";
import { GetMessages, GetChatUsers, getRoomDetails, SendMedia } from "./chat.Controllers";
import { AcceptRequest, BlockReq, followRequest, RequestReject, UnFollowUser, GetMuteUsers, UnBlockReq } from "./follower.Controllers";
import { GetNotifications, markNotificationsAsRead } from "./notifications.Controllers";
import { AccountPrivacy, DeleteCoverImage, DeleteProfileImage, EditCoverImage, EditProfileImage, GetUser, SearchQuery, UpdateProfile, BlockUser, UnBlockUser, GetBlockedUsers } from "./user.Controllers";

export const authController = {
    signup,
    signIn,
    logout,
    RefreshAccessToken,
    googleAuth,
    resetPassword,
    addRecoveryEmail,
    autoLogin,
    sendEmailVerification,
    verifyOtp,
    changePassword,
    getUser,
    resendOTP,
    googleCallback
}

export const userController = {
    EditCoverImage,
    EditProfileImage,
    DeleteCoverImage,
    DeleteProfileImage,
    UpdateProfile,
    SearchQuery,
    GetUser,
    AccountPrivacy,
    BlockUser,
    GetBlockedUsers,
    UnBlockUser
}

export const chatController = {
    GetMessages,
    GetChatUsers,
    getRoomDetails,
    SendMedia
}

export const followController = {
    followRequest,
    AcceptRequest,
    RequestReject,
    UnFollowUser,
    BlockReq,
    UnBlockUser,
    GetMuteUsers,
    UnBlockReq

}

export const NotificationController = {
    GetNotifications,
    markNotificationsAsRead
}