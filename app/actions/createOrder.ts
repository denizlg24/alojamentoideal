"use server";
import { CartItem } from "@/hooks/cart-context";
import { connectDB } from "@/lib/mongodb";
import { generateReservationID } from "@/lib/utils";
import OrderModel from "@/models/Order";
import { verifySession } from "@/utils/verifySession";



type RegisterOrderInput = {
    name: string;
    email: string;
    phoneNumber: string;
    notes?: string;
    reservationIds: string[];
    reservationReferences: string[];
    items: CartItem[];
    payment_id: string;
    transaction_id: string[];
    payment_method_id: string;
    tax_number?: string;
    isCompany: boolean;
    companyName?: string;
    activityBookingIds?: string[],
    activityBookingReferences?: string[],
    orderId?: string
};

export async function registerOrder(data: RegisterOrderInput) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
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
                    invoice: item.invoice
                };
            } else if (item.type == "activity") {
                return {
                    id: item.id,
                    type: "activity",
                    name: item.name,
                    price: item.price,
                    selectedDate: item.selectedDate,
                    selectedRateId: item.selectedRateId,
                    selectedStartTimeId: item.selectedStartTimeId,
                    guests: item.guests,
                    photo: item.photo,
                    invoice: item.invoice
                }
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
                    invoice: item.invoice
                };
            }
        });

        const randomOrderId = generateReservationID();

        const order = new OrderModel({
            orderId: data.orderId ? data.orderId : randomOrderId,
            name: data.name,
            email: data.email,
            phoneNumber: data.phoneNumber,
            notes: data.notes,
            reservationIds: data.reservationIds,
            reservationReferences: data.reservationReferences,
            activityBookingIds:data.activityBookingIds ?? [],
            activityBookingReferences:data.activityBookingReferences ?? [],
            items: plainItems,
            payment_id: data.payment_id,
            transaction_id: data.transaction_id,
            payment_method_id: data.payment_method_id,
            tax_number: data.tax_number,
            isCompany: data.isCompany,
            companyName: data.companyName
        });

        await order.save();
        return { success: true, orderId: order.orderId };
    } catch (error) {
        console.error('Failed to register order:', error);
        return { success: false, error: 'Failed to register order' };
    }
}