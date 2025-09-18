import { connectDB } from '@/lib/mongodb';
import { ChatModel, MessageModel } from '@/models/Chat';
import { ReservationType } from '@/schemas/reservation.schema';
import env from '@/utils/env';
import { hostifyRequest } from '@/utils/hostify-request';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    if (req.headers.get('Authorization') !== `Bearer ${env.CRON_SECRET}`) {
        return NextResponse.json("Unauthorized", { status: 401 });
    }
    await connectDB();
    const foundChats = await ChatModel.find();
    for (const chat of foundChats) {
        const reservation_id = chat.reservation_id;
        const reservation = await hostifyRequest<{ reservation: ReservationType }>(`reservations/${reservation_id}`, "GET");
        if (reservation.reservation) {
            const message_id = reservation.reservation.message_id;
            const info = await hostifyRequest<{
                success: boolean;
                thread: { id: string; channel_unread: number };
                messages: {
                    id: number;
                    target_id: number;
                    message: string;
                    notes: string | null;
                    created: string;
                    image: string | null;
                    guest_name: string;
                    guest_thumb: string;
                    is_sms: number;
                    is_automatic: number;
                    pinned: number;
                    avatar: string | null;
                    guest_id: number;
                }[];
            }>(`inbox/${message_id}`, "GET");
            if (info.success) {
                if (reservation.reservation.guest_id) {
                    let unreadCount = chat.unread;
                    let lastMessage;
                    for (const message of info.messages) {
                        const isGuest = message.guest_id.toString() == reservation.reservation.guest_id.toString();
                        const foundMessage = await MessageModel.findOne({ message_id: message.id });
                        if (foundMessage) {
                            continue;
                        } else {
                            if (isGuest) {
                                unreadCount++;
                            }
                            const newMessageId = message.id;
                            const newMessage = new MessageModel({ chat_id: chat.chat_id, read: !isGuest, sender: isGuest ? "guest" : "admin", message: message.message, message_id: newMessageId })
                            await newMessage.save();
                            lastMessage = message;
                        }

                    }
                    await ChatModel.findOneAndUpdate({ reservation_id }, { unread: unreadCount, lastMessageAt: lastMessage?.created, lastMessage: lastMessage?.message, automation_done: true });
                }
            }
        }

    }

    return NextResponse.json({ ok: true });
}