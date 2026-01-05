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

export const SendMedia = asyncHandler(async (req: Request, res: Response) => {
    const result = await chatService.sendMedia(req)
    res.status(200).json(new ApiResponse(200, result, "files shared."));

})

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
    const result = await chatService.createGroup(req)
    res.status(200).json(new ApiResponse(200, result, "group created."));

})

export const roomMembersList = asyncHandler(async (req: Request, res: Response) => {
    const result = await chatService.RoomMembers(req)
    res.status(200).json(new ApiResponse(200, result, "list fetched."));
})

export const addAdmin = asyncHandler(async (req: Request, res: Response) => {
    const result = await chatService.addAdmin(req)
    res.status(200).json(new ApiResponse(200, result, "admin add."));
})

export const removeAdmin = asyncHandler(async (req: Request, res: Response) => {
    const result = await chatService.removeAdmin(req)
    res.status(200).json(new ApiResponse(200, result, "admin remove."));
})