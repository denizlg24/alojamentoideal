"use server";

import { connectDB } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { OrderSchemaZ } from "@/schemas/order.schema";
import { verifySession } from "@/utils/verifySession";

export async function getOrderByReference(reference: string) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
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