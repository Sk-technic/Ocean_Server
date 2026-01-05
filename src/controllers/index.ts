import { addRecoveryEmail, autoLogin, changePassword, getUser, googleAuth, googleCallback, logout, RefreshAccessToken, resendOTP, resetPassword, sendEmailVerification, signIn, signup, verifyOtp } from "./auth.Controllers";
import { GetMessages, GetChatUsers, SendMedia, createGroup, roomMembersList, addAdmin, removeAdmin } from "./chat.Controllers";
import { AcceptRequest, BlockReq, followRequest, RequestReject, UnFollowUser, GetMuteUsers, UnBlockReq } from "./follower.Controllers";
import { GetNotifications, markNotificationsAsRead } from "./notifications.Controllers";
import { AccountPrivacy, DeleteCoverImage, DeleteProfileImage, EditCoverImage, EditProfileImage, SearchQuery, UpdateProfile, BlockUser, UnBlockUser, GetBlockedUsers, getFollowersFollowing } from "./user.Controllers";

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
    AccountPrivacy,
    BlockUser,
    GetBlockedUsers,
    UnBlockUser,
    getFollowersFollowing
}

export const chatController = {
    GetMessages,
    GetChatUsers,
    SendMedia,
    createGroup,
    roomMembersList,
    addAdmin,
    removeAdmin
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