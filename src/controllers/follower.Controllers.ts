import { Request, Response } from "express";
import { followServices } from "../services";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";


export const followRequest = asyncHandler(async (req: Request, res: Response) => {
    const result = await followServices.sendFollow(req)
    res.status(200).json(new ApiResponse(200, result, "requested"));
})

export const AcceptRequest = asyncHandler(async (req:Request,res:Response) => {
    const result = await followServices.acceptRequest(req)
    res.status(200).json(new ApiResponse(200, result, "request accepted"));
})

export const RequestReject = asyncHandler(async (req:Request,res:Response) => {
    const result = await followServices.rejectRequest(req)
    res.status(200).json(new ApiResponse(200, result, `${result && 'request rejected'}`));
})

export const UnFollowUser = asyncHandler(async (req:Request,res:Response) => {
    const result = await followServices.unfollowUser(req)
    res.status(200).json(new ApiResponse(200, result, `${result && 'unfollowed'}`));
})

export const BlockUser = asyncHandler(async (req:Request,res:Response) => {
    const result = await followServices.blockUser(req)
    res.status(200).json(new ApiResponse(200, result, `user blocked`));
})

export const UnBlockUser = asyncHandler(async (req:Request,res:Response) => {
    const result = await followServices.unblockUser(req)
    res.status(200).json(new ApiResponse(200, result, `user unblock`));
})