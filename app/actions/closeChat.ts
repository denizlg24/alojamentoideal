"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { ChatModel, MessageModel } from "@/models/Chat";
import { verifySession } from "@/utils/verifySession";

export async function closeChat(chat_id: string) {
    try {
        if (!verifySession()) {
            throw new Error("Unauthorized");
        }
        const session = await auth();
        if (!session) {
            throw new Error("Unauthorized");
        }
        await connectDB();
        await MessageModel.deleteMany({ chat_id });
        await ChatModel.findOneAndDelete({ chat_id });
        return true;
    } catch {
        return false;
    }
}