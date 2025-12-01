import { addRecoveryEmail, autoLogin, changePassword, getUser, googleAuth, logout, RefreshAccessToken, resetPassword, sendEmailVerification, sendForgetPasswordMail, signIn, signup, verifyEmail } from "./auth.Controllers";
import { GetMessages, GetChatUsers, getRoomDetails, SendMedia } from "./chat.Controllers";
import { AcceptRequest, BlockUser, followRequest, RequestReject, UnBlockUser, UnFollowUser } from "./follower.Controllers";
import { GetNotifications } from "./notifications.Controllers";
import { AccountPrivacy, DeleteCoverImage, DeleteProfileImage, EditCoverImage, EditProfileImage, GetUser, SearchQuery, UpdateProfile } from "./user.Controllers";

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
    verifyEmail,
    sendForgetPasswordMail,
    changePassword,
    getUser
}

export const userController = {
 EditCoverImage,
 EditProfileImage,
 DeleteCoverImage,
 DeleteProfileImage,
 UpdateProfile,
 SearchQuery,
 GetUser,
 AccountPrivacy
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
    BlockUser,
    UnBlockUser,

}

export const NotificationController = {
    GetNotifications
}