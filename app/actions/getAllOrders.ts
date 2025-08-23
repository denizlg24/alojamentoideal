"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import OrderModel from "@/models/Order";
import { verifySession } from "@/utils/verifySession";
import { getPaymentStatus } from "./getPaymentStatus";

export async function getAllOrders() {
    if (!(await verifySession())) {
        throw new Error("Unauthorized")
    }
    const session = await auth();
    if (!session) {
        throw new Error("Unauthorized")
    }
    await connectDB();
    const [orders, total] = await Promise.all([
        OrderModel.find().lean(), OrderModel.countDocuments()
    ])
    const final = await Promise.all(orders.map(async (order) => ({
        ...order, _id: order._id.toString(), payment_id: { payment_id: order.payment_id, status: order.payment_id ? await getPaymentStatus(order.payment_id) : "not-found" }
    })));
    return {
        orders: final, total
    }
}