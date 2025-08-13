"use server";

import { connectDB } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { OrderSchemaZ } from "@/schemas/order.schema";
import { headers } from "next/headers";

export async function getOrderByReference(reference: string) {
    const origin = (await headers()).get('origin');
    if (origin !== process.env.SITE_URL) {
        throw new Error('Unauthorized request');
    }
    try {
        await connectDB();
        const order = await OrderModel.findOne({
            reservationReferences: reference,
        });

        const serialized = JSON.parse(JSON.stringify(order));

        const parsed = OrderSchemaZ.parse(serialized);

        return parsed._id;
    } catch (error) {
        console.error("Error finding order by reference:", error);
        return null;
    }
}