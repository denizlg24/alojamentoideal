"use server";

import { auth } from "@/auth";
import { generateUniqueId } from "@/lib/utils";
import { ChatModel, MessageModel } from "@/models/Chat";
import { verifySession } from "@/utils/verifySession";

export async function postMessage({
    chatId,
    sender,
    message,
}: {
    chatId: string;
    sender: "guest" | "admin";
    message: string;
}) {
    if (!(await verifySession())) {
        throw new Error("Unauthorized");
    }

    if (sender == "admin") {
        const session = await auth();
        if (!session) {
            throw new Error("Unauthorized")
        }
    }

    const chat = await ChatModel.findOne({ chat_id: chatId });
    if (!chat) {
        return false;
    }

    const newMessage = new MessageModel({
        chat_id: chatId,
        sender,
        message,
        message_id: generateUniqueId(),
        read: sender === "admin",
    });

    await newMessage.save();

    // update chat metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {
        lastMessage: message,
        lastMessageAt: new Date(),
    };

    if (sender === "guest") {
        update.$inc = { unread: 1 };
    }

    await ChatModel.updateOne({ chat_id: chatId }, update);
    const json = newMessage.toJSON()
    return { ...json, _id: (json._id as string).toString() };
}