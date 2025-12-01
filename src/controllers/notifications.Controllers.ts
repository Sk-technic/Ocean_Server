import { Request,Response } from "express";
import { notificationServices } from "../services";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";



export const GetNotifications = asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationServices.getNotifications(req)
    res.status(200).json(new ApiResponse(200,result,"notification fetched"));
});