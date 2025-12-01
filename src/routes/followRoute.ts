import { followController } from "../controllers";
import { Router } from "express";


export const followRouter = Router();

followRouter.route("/follow/:id").post(followController.followRequest);
followRouter.route("/accept").post(followController.AcceptRequest);
followRouter.route("/reject/:id").delete(followController.RequestReject);
followRouter.route("/unfollow/:id").delete(followController.UnFollowUser);
followRouter.route("/block/:id").post(followController.BlockUser);
followRouter.route("/unblock/:id").delete(followController.UnBlockUser);

// followRouter.get("/followers/:id", getFollowers);
// followRouter.get("/following/:id", getFollowing);
// followRouter.get("/mutual/:id", getMutual);
