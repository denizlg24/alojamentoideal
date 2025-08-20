"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { ChatModel } from "@/models/Chat";
import { verifySession } from "@/utils/verifySession";

export async function getInbox({ chat_id }: { chat_id: string }) {
    if (!verifySession()) {
        throw new Error("Unauthorized");
    }
    const session = await auth();
    if (!session) {
        throw new Error("Unauthorized");
    }
    try {
        await connectDB();
        const inbox = await ChatModel.findOne({ chat_id }).lean();
        if (inbox)
            return { ...inbox, _id: (inbox._id as string).toString() };
        return undefined;
    } catch {
        return undefined;
    }
}