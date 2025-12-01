import { Request } from "express";
import { Collections } from "../models";
import mongoose from "mongoose";



export const getNotifications = async(req:Request)=>{
    const userId:string = req.params.Id
        const notifications = await Collections.NotificationModel.findOne({user:new mongoose.Types.ObjectId(userId)})
    return notifications
}