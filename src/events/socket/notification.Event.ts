import { notificationSubscribe } from "../../events/redis/notification.sub";
import { Server, Socket } from "socket.io";

export const initNotificationListner = (
    io: Server,
    socket: Socket,
    userId: string
) => {

    const channel = `notification:${userId}`;

    notificationSubscribe(channel, (data) => {
        console.log("notification data: ", data);
        io.to(userId).emit("new:notification",data)
    });

    console.log("Notification listening for", userId);

}