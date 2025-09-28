"use server";

import { auth } from "@/auth";
import { generateUniqueId } from "@/lib/utils";
import { ChatModel, MessageModel } from "@/models/Chat";
import { verifySession } from "@/utils/verifySession";
import { getOrderByReservationId } from "./getOrderByReference";
import { getHtml } from "./getHtml";
import { getTranslations } from "next-intl/server";
import env from "@/utils/env";
import { sendMail } from "./sendMail";
import { format } from "date-fns";
import { connectDB } from "@/lib/mongodb";

export async function postMessage({
    chatId,
    sender,
    message,
    optimisticMessageId
}: {
    chatId: string;
    sender: "guest" | "admin";
    message: string;
    optimisticMessageId?: string;
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

    await connectDB();

    const chat = await ChatModel.findOne({ chat_id: chatId }).lean();
    if (!chat) {
        return false;
    }

    if(sender == 'admin'){
        const res = await getOrderByReservationId(chat.reservation_id);
        if(typeof res.order != 'boolean'){
            const t = await getTranslations("chat-email");
            const userEmail = res.order.email;
            const orderHtml = await getHtml('emails/invoice-sent-email.html',
                [{ "{{products_html}}":`Your host wrote on ${format(new Date(),'dd/MM/yyyy hh:mm')}:\n ${message}` },
                { "{{your-invoice-is-ready}}": t('you-got-a-new-message') },
                { "{{view-your-invoice}}": t('view-your-note') },
                { "{{order-number}}": t('reservation-number', { order_id: chat.booking_reference }) },
                { '{{invoice_url}}': `${env.SITE_URL}/reservations/${chat.reservation_id}` }
                ])

            await sendMail({
                email: userEmail,
                html: orderHtml,
                subject: t('new-message', { order_id: chat.booking_reference }),
            });
        }
    } else {
        const res = await getOrderByReservationId(chat.reservation_id);
        if(typeof res.order != 'boolean'){
            const t = await getTranslations("chat-email");
            const adminEmail = env.ADMIN_EMAIL;
            const orderHtml = await getHtml('emails/invoice-sent-email.html',
                [{ "{{products_html}}":`${res.order.name} wrote on ${format(new Date(),'dd/MM/yyyy hh:mm')}:\n ${message}` },
                { "{{your-invoice-is-ready}}": t('you-got-a-new-message') },
                { "{{view-your-invoice}}": t('view-your-note') },
                { "{{order-number}}": t('reservation-number', { order_id: chat.booking_reference }) },
                { '{{invoice_url}}': `${env.SITE_URL}/admin/dashboard/orders/${res.order.orderId}` }
                ])

            await sendMail({
                email: adminEmail,
                html: orderHtml,
                subject: t('new-admin-message', { order_id: chat.booking_reference }),
            });
        }
    }


    const newMessage = new MessageModel({
        chat_id: chatId,
        sender,
        message,
        message_id: optimisticMessageId ?? generateUniqueId(),
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