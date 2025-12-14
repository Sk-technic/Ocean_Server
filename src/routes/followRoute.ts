import { followController } from "../controllers";
import { Router } from "express";


export const followRouter = Router();

followRouter.route("/follow/:id").post(followController.followRequest);
followRouter.route("/accept").post(followController.AcceptRequest);
followRouter.route("/reject").post(followController.RequestReject);
followRouter.route("/unfollow/:id").delete(followController.UnFollowUser);
followRouter.route("/block_request/:id").post(followController.BlockReq);
followRouter.route("/unblock_request/:id").delete(followController.UnBlockReq);
followRouter.route("/muteUsers").get(followController.GetMuteUsers)
// followRouter.get("/followers/:id", getFollowers);
// followRouter.get("/following/:id", getFollowing);
// followRouter.get("/mutual/:id", getMutual);
