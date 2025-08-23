"use server";
import mongoose, { Document } from "mongoose";

interface MessageDocument extends Document {
    chat_id: string;
    message_id: string;
    message: string;
    sender: "guest" | "admin";
    createdAt: Date;
    read: boolean;
}

export interface IMessage {
    chat_id: string;
    message_id: string
    message: string;
    sender: "guest" | "admin";
    createdAt: Date;
    read: boolean;
}

const MessageSchema = new mongoose.Schema<MessageDocument>({
    chat_id: { type: String, required: true, index: true },
    message_id: { type: String, required: true },
    message: { type: String, required: true },
    sender: { type: String, enum: ["guest", "admin"], required: true },
    read: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const MessageModel: mongoose.Model<MessageDocument> = mongoose.models.Message || mongoose.model<MessageDocument>("Message", MessageSchema);

interface ChatDocument extends Document {
    chat_id: string;
    reservation_id: string;
    booking_reference: string;
    lastMessage: string;
    lastMessageAt: Date;
    unread: number;
    guest_name: string;
    status: "open" | "closed";
    automation_done: boolean;
}

export interface IChatDocument {
    chat_id: string;
    reservation_id: string;
    booking_reference: string;
    lastMessage: string;
    lastMessageAt: Date;
    unread: number;
    guest_name: string;
    status: "open" | "closed";
    automation_done: boolean;
}

const ChatSchema = new mongoose.Schema<ChatDocument>({
    chat_id: { type: String, unique: true, required: true },
    reservation_id: String,
    booking_reference: String,
    lastMessage: String,
    lastMessageAt: Date,
    unread: { type: Number, default: 0 },
    guest_name: String,
    status: { type: String, enum: ["open", "closed"], required: true },
    automation_done: { type: Boolean, default: false },
});

export const ChatModel: mongoose.Model<ChatDocument> = mongoose.models.Chat || mongoose.model<ChatDocument>("Chat", ChatSchema);