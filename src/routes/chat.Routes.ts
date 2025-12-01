import { Router } from "express";
import { chatController } from "../controllers";
import { uploadMedia } from "../middlewares/multer.middleware";

const ChatRoutes = Router();
ChatRoutes.route("/messages/:roomId").get(chatController.GetMessages)

ChatRoutes.route("/users").get(chatController.GetChatUsers)
ChatRoutes.route("/room").get(chatController.getRoomDetails)
ChatRoutes.route("/send_media").post(uploadMedia.fields([{ name: "media", maxCount: 10 }]),chatController.SendMedia)




export { ChatRoutes }