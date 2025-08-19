"use server";

import { auth } from "@/auth";
import { ChatModel, MessageModel } from "@/models/Chat";
import { verifySession } from "@/utils/verifySession";

export async function getChatMessages(chat_id: string, admin = false) {
    try {
        if (!verifySession()) {
            throw new Error("Unauthorized");
        }
        if (admin) {
            const session = await auth();
            if (!session) {
                throw new Error("Unauthorized");
            }
            await MessageModel.updateMany({ chat_id }, { read: true });
            await ChatModel.updateOne({ chat_id }, { unread: 0 });
        }
        const foundMessages = await MessageModel.find({ chat_id }).lean();
        if (foundMessages) {
            return foundMessages.map((msg) => ({
                ...msg,
                _id: msg._id.toString()
            }));
        }
        return [];
    } catch {
        return [];
    }
}