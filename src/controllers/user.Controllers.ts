import { userService } from "../services";
import { asyncHandler } from "../utils/asyncHandler"
import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";

export const EditCoverImage = asyncHandler(async (req: Request, res: Response) => {
    await userService.EditCoverImage(req)
    res.status(200).json(new ApiResponse(200,[],"Cover image updated successfully"));
});

export const EditProfileImage = asyncHandler(async (req: Request, res: Response) => {
    await userService.EditProfileImage(req)
    res.status(200).json(new ApiResponse(200,[],"profile image updated successfully"));
});

export const DeleteProfileImage = asyncHandler(async (req: Request, res: Response) => {
    await userService.DeleteProfileImage(req)
    res.status(200).json(new ApiResponse(200,[],"profile Pic removed"));
});

export const DeleteCoverImage = asyncHandler(async (req: Request, res: Response) => {
    await userService.DeleteCoverImage(req)
    res.status(200).json(new ApiResponse(200,[],"cover image removed"));
});

export const UpdateProfile = asyncHandler(async (req: Request, res: Response) => {
    const updatedUser = await userService.UpdateProfile(req)
    res.status(200).json(new ApiResponse(200,updatedUser,"Profile updated successfully"));
});

export const SearchQuery = asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.SearchQuery(req)
    res.status(200).json(new ApiResponse(200,result,"find successfull."));
});

export const GetUser = asyncHandler(async (req:Request,res:Response) => {
    const result = await userService.GetUser(req)
        res.status(200).json(new ApiResponse(200,result,"find successfull."));
})

export const AccountPrivacy = asyncHandler(async (req:Request, res:Response)=>{
    const result = await userService.AccountPrivacy(req)
    res.status(200).json(new ApiResponse(200,result,"Account Privacy updated"))
})

export const BlockUser = asyncHandler(async (req:Request, res:Response)=>{
    const result = await userService.BlockUser(req)
    res.status(200).json(new ApiResponse(200,result,"user Blocked"))
})

export const GetBlockedUsers = asyncHandler(async (req:Request, res:Response)=>{
    const result = await userService.GetBlockedUsers(req)
    res.status(200).json(new ApiResponse(200,result,"Blocked users fetched successfully"))
})

export const UnBlockUser = asyncHandler(async (req:Request, res:Response)=>{
    const result = await userService.UnBlockUser(req)
    res.status(200).json(new ApiResponse(200,result,"user unblocked"))
})