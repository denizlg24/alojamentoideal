"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import OrderModel from "@/models/Order";
import { verifySession } from "@/utils/verifySession";
import { getPaymentStatus } from "./getPaymentStatus";
import { getPaymentIntent } from "./getPaymentIntent";
import { UnauthorizedError } from "@/lib/utils";

export async function getAllOrders() {
    if (!(await verifySession())) {
        throw new UnauthorizedError();
    }
    const session = await auth();
    if (!session) {
        throw new UnauthorizedError();
    }
    await connectDB();
    const [orders, total] = await Promise.all([
        OrderModel.find().lean(), OrderModel.countDocuments()
    ])
    const final = await Promise.all(orders.map(async (order) => {
        const status = order.payment_id ? await getPaymentStatus(order.payment_id) : "not-found";
        const { charge } = order.payment_id ? await getPaymentIntent(order.payment_id) : { charge: undefined };
        return {
            ...order, _id: order._id.toString(),
            payment_id: { payment_id: order.payment_id, status },
            payment_method_id: { payment_method_id: order.payment_method_id, charge }
        }
    }));
    return {
        orders: final, total
    }
}