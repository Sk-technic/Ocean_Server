import { Router } from "express";
import { chatController } from "../controllers";
import { uploadImage, uploadMedia } from "../middlewares/multer.middleware";

const ChatRoutes = Router();
ChatRoutes.route("/messages/:roomId").get(chatController.GetMessages)

ChatRoutes.route("/users").get(chatController.GetChatUsers)
ChatRoutes.route("/room").post(uploadImage.single("avatar"),chatController.createGroup)
ChatRoutes.route("/send_media").post(uploadMedia.fields([{ name: "media", maxCount: 10 }]),chatController.SendMedia)
ChatRoutes.route("/room/:roomId").get(chatController.roomMembersList)
ChatRoutes.route("/addAdmin").post(chatController.addAdmin)
ChatRoutes.route("/removeAdmin").post(chatController.removeAdmin)





export { ChatRoutes }