import { addRecoveryEmail, autoLogin, changePassword, getUser, googleAuth, googleCallback, logout, RefreshAccessToken, resendOtp, sendForgetPasswordMail, signIn, signup, verifyOtp, } from "./auth.Services";
import { createSingleRoom, editMessage, getMessages, sendMedia, GetRoomDetails, unsendMessage, clearChat, chatRooms, sendMessage, readChat, MessageSeenUpdate, acceptMessageRequest } from "./chat.Services";
import { acceptRequest, blockUser, rejectRequest, sendFollow, unblockUser, unfollowUser } from "./follower.Service";
import { getNotifications } from "./notifications";
import { DeleteCoverImage, DeleteProfileImage, EditCoverImage, EditProfileImage, SearchQuery, UpdateProfile, GetUser, SetOnline, SetAway, updateLastActive, AccountPrivacy } from "./user.Services";

export const authService = {
    signup,
    signIn,
    logout,
    RefreshAccessToken,
    googleAuth,
    // resetPassword,
    addRecoveryEmail,
    autoLogin,
    // sendEmailVerification,
    verifyOtp,
    sendForgetPasswordMail,
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
    AccountPrivacy
}

export const chatService = {
    sendMessage,
    sendMedia,
    createSingleRoom,
    getMessages,
    chatRooms,
    GetRoomDetails,
    unsendMessage,
    editMessage,
    clearChat,
    readChat,
    MessageSeenUpdate,
    acceptMessageRequest
}

export const followServices = {
    sendFollow,
    acceptRequest,
    rejectRequest,
    unfollowUser,
    blockUser,
    unblockUser,

    
}

export const notificationServices = {
    getNotifications
}