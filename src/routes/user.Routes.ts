import { Router } from "express";
import { uploadImage } from "../middlewares/multer.middleware";
import { userController } from "../controllers";

const UserRoute = Router();

UserRoute.route("/coverImage").post( uploadImage.fields([{ name: "coverImage", maxCount: 1 },]),userController.EditCoverImage)

UserRoute.route("/profileImage").post( uploadImage.fields([{ name: "profilepic", maxCount: 1 },]),userController.EditProfileImage)

UserRoute.route("/removeProfileImage").delete(userController.DeleteProfileImage);

UserRoute.route("/removeCoverImage").delete(userController.DeleteCoverImage);

UserRoute.route("/updateProfile").put(userController.UpdateProfile);

UserRoute.route("/:query").post(userController.SearchQuery)

UserRoute.route("/:roomId").get(userController.GetUser)

UserRoute.route("/privacy/:userId").post(userController.AccountPrivacy)

export { UserRoute };


