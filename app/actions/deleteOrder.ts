"use server";

import { auth } from "@/auth";
import { ChatModel, MessageModel } from "@/models/Chat";
import GuestDataModel from "@/models/GuestData";
import OrderModel from "@/models/Order";
import { hostifyRequest } from "@/utils/hostify-request";
import { verifySession } from "@/utils/verifySession";

export async function deleteOrder(order_id: string) {
    if (!(await verifySession())) {
        throw new Error("Unauthorized");
    }

    const session = await auth();
    if (!session) {
        throw new Error("Unauthorized")
    }
    try {
        const foundOrder = await OrderModel.findOneAndDelete({ orderId: order_id });
        if (!foundOrder) {
            return false;
        }

        for (const reservationId of foundOrder.reservationIds) {
            await hostifyRequest<{ success: boolean }>(
                `reservations/${reservationId}`,
                "PUT",
                undefined,
                {
                    status: "cancelled_by_host",
                },
                undefined,
                undefined
            );
            const foundChat = await ChatModel.findOneAndDelete({ reservation_id: reservationId });
            if (foundChat) {
                await MessageModel.deleteMany({ chat_id: foundChat.chat_id });
            }
        }
        for (const reservationReference of foundOrder.reservationReferences) {
            await GuestDataModel.findOneAndDelete({ booking_code: reservationReference });
        }
        for (const transactionId of foundOrder.transaction_id) {
            await hostifyRequest<{ success: boolean }>(
                `transactions/${transactionId}`,
                "PUT",
                undefined,
                {
                    arrival_date: "",
                    is_completed: 0,
                    details: `Deleted order by: ${session.user?.id}`
                },
                undefined,
                undefined
            );
        }
        return true;
    } catch {
        return false;
    }


}