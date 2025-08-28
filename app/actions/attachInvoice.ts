"use server"

import { connectDB } from "@/lib/mongodb";
import OrderModel from "@/models/Order";
import { verifySession } from "@/utils/verifySession";

export async function attachInvoice({
    orderId,
    index,
    invoice_url,
}: {
    orderId: string,
    index: number,
    invoice_url: string,
}) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
    }
    try {
        await connectDB();
        const updated = await OrderModel.findOneAndUpdate(
            { orderId },
            { $set: { [`items.${index}.invoice`]: invoice_url } },
            { new: true }
        );

        if (!updated) {
            throw new Error("Order not found");
        }

        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}