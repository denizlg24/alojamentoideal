"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { ChatModel, MessageModel } from "@/models/Chat";
import { verifySession } from "@/utils/verifySession";

export async function getChatMessages(chat_id: string, admin = false, since?: Date) {
    try {
        if (!verifySession()) {
            throw new Error("Unauthorized");
        }
        if (admin) {
            const session = await auth();
            if (!session) {
                throw new Error("Unauthorized");
            }
            await connectDB();
            await MessageModel.updateMany({ chat_id }, { read: true });
            await ChatModel.updateOne({ chat_id }, { unread: 0 });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { chat_id };

        if (since) {
            query.createdAt = { $gt: since };
        }

        const foundMessages = await MessageModel.find(query).lean();

        if (foundMessages) {
            return foundMessages.map((msg) => ({
                ...msg,
                _id: msg._id.toString(),
            }));
        }
        return [];
    } catch {
        return [];
    }
}