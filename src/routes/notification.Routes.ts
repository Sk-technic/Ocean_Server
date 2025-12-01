import { NotificationController } from "../controllers";
import { Router } from "express";


export const notificationRoutes = Router();

notificationRoutes.route("/fetch/:Id").get(NotificationController.GetNotifications);

