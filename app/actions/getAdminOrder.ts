"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import OrderModel from "@/models/Order";
import { verifySession } from "@/utils/verifySession";
import { getPaymentStatus } from "./getPaymentStatus";

export async function getAdminOrder(orderId: string) {
    if (!(await verifySession())) {
        throw new Error("Unauthorized")
    }
    const session = await auth();
    if (!session) {
        throw new Error("Unauthorized")
    }
    await connectDB();
    const order = await OrderModel.findOne({ orderId });
    if (!order) {
        return undefined;
    }
    const final = {
        ...order, _id: order._id.toString(), payment_id: { payment_id: order.payment_id, status: await getPaymentStatus(order.payment_id) }
    };
    return final;
}