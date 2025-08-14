"use server";
import { connectDB } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { OrderSchemaZ } from "@/schemas/order.schema";
import { verifySession } from "@/utils/verifySession";
import mongoose from "mongoose";

export async function getOrderById(orderId: string) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
    }
    try {
        await connectDB();

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            throw new Error("Invalid order ID");
        }

        const order = await OrderModel.findById(orderId).lean();

        if (!order) {
            return { success: false, error: "Order not found" };
        }

        const serialized = JSON.parse(JSON.stringify(order));
        const parsed = OrderSchemaZ.parse(serialized);
        return { success: true, order: parsed };
    } catch (error) {
        console.error("Failed to get order:", error);
        return { success: false, error: "Failed to get order", order: undefined };
    }
}