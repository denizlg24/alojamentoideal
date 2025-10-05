"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { UnauthorizedError } from "@/lib/utils";
import { ChatModel } from "@/models/Chat";
import { verifySession } from "@/utils/verifySession";

export async function getInboxes() {
    if (!verifySession()) {
        throw new UnauthorizedError();
    }
    const session = await auth();
    if (!session) {
        throw new UnauthorizedError();
    }
    try {
        await connectDB();
        const inboxes = await ChatModel.find().lean();
        return inboxes.map((inbox) => ({ ...inbox, _id: (inbox._id as string).toString() }));
    } catch {
        return []
    }
}