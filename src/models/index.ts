import { UserModel } from "./user.Model";
import { PostModel } from "./posts.Model";
import { VideoModel } from "./videos.Model";
import { ChatMember, ChatRoom, Message } from "./chat.Models";
import { FollowModel } from "./follower.Model";
import { BlockModel } from "./blockedUser.Model";
import { NotificationModel } from "./notification.Model";
const Collections = {
     UserModel,
    PostModel,
    VideoModel,
    ChatRoom,
    Message,
    FollowModel,
    BlockModel,
    ChatMember,
    NotificationModel

}

export {
    Collections
}