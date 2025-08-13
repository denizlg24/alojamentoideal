"use server";
import { CartItem } from "@/hooks/cart-context";
import { connectDB } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { headers } from "next/headers";


type RegisterOrderInput = {
    name: string;
    email: string;
    phoneNumber: string;
    notes?: string;
    reservationIds: string[];
    reservationReferences: string[];
    items: CartItem[];
};

export async function registerOrder(data: RegisterOrderInput) {
    const origin = (await headers()).get('origin');
    if (origin !== process.env.SITE_URL) {
        throw new Error('Unauthorized request');
    }
    try {
        await connectDB();

        const plainItems = data.items.map((item) => {
            if (item.type === "product") {
                return {
                    type: "product",
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    photo: item.photo,
                    description: item.description,
                };
            } else {
                return {
                    type: "accommodation",
                    property_id: item.property_id,
                    name: item.name,
                    start_date: item.start_date,
                    end_date: item.end_date,
                    adults: item.adults,
                    children: item.children,
                    infants: item.infants,
                    pets: item.pets,
                    front_end_price: item.front_end_price,
                    photo: item.photo,
                    fees: item.fees,
                };
            }
        });

        const order = new OrderModel({
            name: data.name,
            email: data.email,
            phoneNumber: data.phoneNumber,
            notes: data.notes,
            reservationIds: data.reservationIds,
            reservationReferences: data.reservationReferences,
            items: plainItems,
        });

        await order.save();
        return { success: true, orderId: order._id.toString() };
    } catch (error) {
        console.error('Failed to register order:', error);
        return { success: false, error: 'Failed to register order' };
    }
}