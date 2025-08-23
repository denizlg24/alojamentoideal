"use server";

import { ChatModel } from "@/models/Chat";
import { verifySession } from "@/utils/verifySession";

export async function getChatId(reservation_id: string) {
    try {
        if (!verifySession()) {
            throw new Error("Unauthorized");
        }
        const foundChat = await ChatModel.findOne({ reservation_id });
        if (foundChat) {
            return foundChat.chat_id;
        }
        return "";
    } catch {
        return "";
    }
}