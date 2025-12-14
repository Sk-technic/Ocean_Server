import { NotificationController } from "../controllers";
import { Router } from "express";


export const notificationRoutes = Router();

notificationRoutes.route("/fetch/:Id").get(NotificationController.GetNotifications);
notificationRoutes.route("/read_all/:id").get(NotificationController.markNotificationsAsRead);


