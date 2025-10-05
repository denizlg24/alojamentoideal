"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { UnauthorizedError } from "@/lib/utils";
import { ChatModel, MessageModel } from "@/models/Chat";
import { verifySession } from "@/utils/verifySession";

export async function closeChat(chat_id: string) {
    try {
        if (!verifySession()) {
            throw new UnauthorizedError();
        }
        const session = await auth();
        if (!session) {
            throw new UnauthorizedError();
        }
        await connectDB();
        await MessageModel.deleteMany({ chat_id });
        await ChatModel.findOneAndDelete({ chat_id });
        return true;
    } catch {
        return false;
    }
}