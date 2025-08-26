"use server";
import { connectDB } from "@/lib/mongodb";
import { ChatModel, MessageModel } from "@/models/Chat";
import { verifySession } from "@/utils/verifySession";

export async function syncAutomatedMessages(reservationId: string, guest_id: string, messages: {
    id: number;
    target_id: number;
    message: string;
    notes: string | null;
    created: string;
    image: string | null;
    guest_name: string;
    guest_thumb: string;
    is_sms: number;
    is_automatic: number;
    pinned: number;
    avatar: string | null;
    guest_id: number;
}[]) {
    if (!(await verifySession())) {
        throw new Error("Unauthorized")
    }
    await connectDB();
    const foundChat = await ChatModel.findOne({ reservation_id: reservationId });
    if (!foundChat) {
        return true;
    }
    let unreadCount = foundChat.unread;
    let lastMessage;
    for (const message of messages) {
        const isGuest = message.guest_id.toString() == guest_id;
        const foundMessage = await MessageModel.findOne({ message_id: message.id });
        if (foundMessage) {
            continue;
        } else {
            if (isGuest) {
                unreadCount++;
            }
            const newMessageId = message.id;
            const newMessage = new MessageModel({ chat_id: foundChat.chat_id, read: !isGuest, sender: isGuest ? "guest" : "admin", message: message.message, message_id: newMessageId })
            await newMessage.save();
            lastMessage = message;
        }

    }
    await ChatModel.findOneAndUpdate({ reservation_id: reservationId }, { unread: unreadCount, lastMessageAt: lastMessage?.created, lastMessage: lastMessage?.message, automation_done: true });
    return true;
}