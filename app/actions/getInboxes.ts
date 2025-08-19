"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { ChatModel } from "@/models/Chat";
import { verifySession } from "@/utils/verifySession";

export async function getInboxes() {
    if (!verifySession()) {
        throw new Error("Unauthorized");
    }
    const session = await auth();
    if (!session) {
        throw new Error("Unauthorized");
    }
    try {
        await connectDB();
        const inboxes = await ChatModel.find().lean();
        return inboxes.map((inbox) => ({ ...inbox, _id: (inbox._id as string).toString() }));
    } catch {
        return []
    }
}