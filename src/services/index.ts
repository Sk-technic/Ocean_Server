import { addRecoveryEmail, autoLogin, changePassword, getUser, googleAuth, googleCallback, logout, RefreshAccessToken, resendOtp, resetPassword, sendEmailVerification, signIn, signup, verifyOtp, } from "./auth.Services";
import { editMessage, getMessages, sendMedia, unsendMessage, clearChat, chatRooms, readChat, MessageSeenUpdate, acceptMessageRequest, sendTextMessage } from "./chat.Services";
import { acceptRequest, blockReq, GetMuteUsers, rejectRequest, sendFollow, unblockReq, unfollowUser } from "./follower.Service";
import { getNotifications, markNotificationsAsRead } from "./notifications";
import { DeleteCoverImage, DeleteProfileImage, EditCoverImage, EditProfileImage, SearchQuery, UpdateProfile, GetUser, SetOnline, SetAway, updateLastActive, AccountPrivacy, BlockUser, UnBlockUser, GetBlockedUsers } from "./user.Services";

export const authService = {
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
    resendOtp,
    googleCallback
}

export const userService = {
    EditCoverImage,
    EditProfileImage,
    DeleteCoverImage,
    DeleteProfileImage,
    UpdateProfile,
    SearchQuery,
    GetUser,
    SetOnline,
    updateLastActive,
    SetAway,
    AccountPrivacy,
    BlockUser,
    GetBlockedUsers,
    UnBlockUser
}

export const chatService = {
    sendMedia,
    getMessages,
    chatRooms,
    unsendMessage,
    editMessage,
    clearChat,
    readChat,
    MessageSeenUpdate,
    acceptMessageRequest,
    sendTextMessage
}

export const followServices = {
    sendFollow,
    acceptRequest,
    rejectRequest,
    unfollowUser,
    blockReq,
    unblockReq,
    GetMuteUsers
}

export const notificationServices = {
    getNotifications,
    markNotificationsAsRead
}