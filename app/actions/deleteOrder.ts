"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { UnauthorizedError } from "@/lib/utils";
import { ChatModel, MessageModel } from "@/models/Chat";
import GuestDataModel from "@/models/GuestData";
import OrderModel from "@/models/Order";
import { hostifyRequest } from "@/utils/hostify-request";
import { verifySession } from "@/utils/verifySession";

export async function deleteOrder(order_id: string) {
    if (!(await verifySession())) {
        throw new UnauthorizedError();
    }

    const session = await auth();
    try {
        await connectDB();
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
            await GuestDataModel.deleteMany({ booking_code: reservationReference });
        }
        for (const transactionId of foundOrder.transaction_id) {
            await hostifyRequest<{ success: boolean }>(
                `transactions/${transactionId}`,
                "PUT",
                undefined,
                {
                    arrival_date: "",
                    is_completed: 0,
                    details: session ? `Deleted order by: ${session.user?.id}` : `Order deleted automatically for payment error.`
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