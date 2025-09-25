"use server"

import { connectDB } from "@/lib/mongodb";
import OrderModel from "@/models/Order";

export async function attachInvoice({
    orderId,
    index,
    invoice_url,
}: {
    orderId: string,
    index: number,
    invoice_url: { url: string, id: string },
}) {
    try {
        await connectDB();
        const updated = await OrderModel.findOneAndUpdate(
            { orderId },
            { $set: { [`items.${index}.invoice`]: invoice_url.url, [`items.${index}.invoice_id`]: invoice_url.id } },
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