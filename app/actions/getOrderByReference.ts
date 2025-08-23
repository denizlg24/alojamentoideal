"use server";

import { connectDB } from "@/lib/mongodb";
import OrderModel from "@/models/Order";
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
        if (order) {
            return { order: order.orderId, reservation: (order.reservationIds.length == 1 && order.items.length == 1) ? order.reservationIds[0] : false };
        } else {
            const orderNumber = await OrderModel.findOne({
                orderId: reference
            })
            if (orderNumber) {
                return { order: orderNumber.orderId, reservation: false };
            }
        }
        return { order: false };
    } catch (error) {
        console.error("Error finding order by reference:", error);
        return { order: false };
    }
}

export async function getOrderByReservationId(reservation_id: string) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
    }
    try {
        await connectDB();
        const order = await OrderModel.findOne({
            reservationIds: reservation_id,
        }).lean();
        if (order) {
            return { order: { ...order, _id: order._id.toString() } };
        }
        return { order: false };
    } catch (error) {
        console.error("Error finding order by reference:", error);
        return { order: false };
    }
}