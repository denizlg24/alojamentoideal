"use server";
import { connectDB } from "@/lib/mongodb";
import OrderModel from "@/models/Order";
import { verifySession } from "@/utils/verifySession";

export async function getOrderById(orderId: string) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
    }
    try {
        await connectDB();
        const order = await OrderModel.findOne({ orderId }).lean();
        if (!order) {
            return { success: false, error: "Order not found" };
        }
        return { success: true, order: { ...order, _id: order._id.toString() } };
    } catch (error) {
        console.error("Failed to get order:", error);
        return { success: false, error: "Failed to get order", order: undefined };
    }
}