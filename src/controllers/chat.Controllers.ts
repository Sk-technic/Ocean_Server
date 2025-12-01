import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { chatService } from "../services";
import { ApiResponse } from "../utils/ApiResponse";

export const GetMessages = asyncHandler(async (req: Request, res: Response) => {
    const result = await chatService.getMessages(req)
    res.status(200).json(new ApiResponse(200, result, "fetched."));
})

export const GetChatUsers = asyncHandler(async (req: Request, res: Response) => {
    const result = await chatService.chatRooms(req)
    res.status(200).json(new ApiResponse(200, result, "list fetched."));
})

export const getRoomDetails = asyncHandler(async (req: Request, res: Response) => {
    const result = await chatService.GetRoomDetails(req);
    res.status(200).json(new ApiResponse(200, result, "fetched."));

})

export const SendMedia = asyncHandler(async (req: Request, res: Response) => {
    const result = await chatService.sendMedia(req)
    res.status(200).json(new ApiResponse(200, result, "files shared."));

})