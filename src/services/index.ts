import { addRecoveryEmail, autoLogin, changePassword, getUser, googleAuth, googleCallback, logout, RefreshAccessToken, resendOtp, resetPassword, sendEmailVerification, signIn, signup, verifyOtp, } from "./auth.Services";
import { editMessage, getMessages, sendMedia, unsendMessage, chatRooms, readChat, acceptMessageRequest, sendTextMessage, createGroup, RoomMembers, addAdmin, removeAdmin } from "./chat.Services";
import { acceptRequest, blockReq, GetMuteUsers, rejectRequest, sendFollow, unblockReq, unfollowUser } from "./follower.Service";
import { getNotifications, markNotificationsAsRead } from "./notifications";
import { DeleteCoverImage, DeleteProfileImage, EditCoverImage, EditProfileImage, SearchQuery, UpdateProfile, SetOnline, SetAway, updateLastActive, AccountPrivacy, BlockUser, UnBlockUser, GetBlockedUsers, getFollowersFollowing } from "./user.Services";

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
    SetOnline,
    updateLastActive,
    SetAway,
    AccountPrivacy,
    BlockUser,
    GetBlockedUsers,
    UnBlockUser,
    getFollowersFollowing
}

export const chatService = {
    sendMedia,
    getMessages,
    chatRooms,
    unsendMessage,
    editMessage,
    readChat,
    acceptMessageRequest,
    sendTextMessage,
    createGroup,
    RoomMembers,
    addAdmin,
    removeAdmin
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