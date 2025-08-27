"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import OrderModel from "@/models/Order";
import { verifySession } from "@/utils/verifySession";
import { getPaymentStatus } from "./getPaymentStatus";
import { getPaymentIntent } from "./getPaymentIntent";

export async function getAdminOrder(orderId: string) {
    if (!(await verifySession())) {
        throw new Error("Unauthorized")
    }
    const session = await auth();
    if (!session) {
        throw new Error("Unauthorized")
    }
    await connectDB();
    const order = await OrderModel.findOne({ orderId }).lean();
    if (!order) {
        return undefined;
    }

    const status = order.payment_id ? await getPaymentStatus(order.payment_id) : "not-found";
    const { charge } = order.payment_id ? await getPaymentIntent(order.payment_id) : { charge: undefined };
    return {
        ...order, _id: order._id.toString(),
        payment_id: { payment_id: order.payment_id, status },
        payment_method_id: { payment_method_id: order.payment_method_id, charge }
    }
}