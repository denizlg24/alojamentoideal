"use server"

import { hostifyRequest } from "@/utils/hostify-request";
import { fetchClientSecret } from "./stripe";
import { calculateAmount } from "./calculateAmount";
import { ReservationType } from "@/schemas/reservation.schema";
import { AccommodationItem } from "@/hooks/cart-context";
import { format } from "date-fns";
import { registerOrder } from "./createOrder";
import { verifySession } from "@/utils/verifySession";

export async function purchaseAccommodation({ property, clientName, clientEmail, clientPhone, clientNotes }: { property: AccommodationItem, clientName: string, clientEmail: string, clientPhone: string, clientNotes?: string }) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
    }
    try {
        const amount = await calculateAmount([property]);
        const reservation = await hostifyRequest<{ reservation: ReservationType }>(
            `reservations`,
            "POST",
            undefined,
            {
                listing_id: property.property_id,
                start_date: property.start_date,
                end_date: property.end_date,
                name: clientName,
                email: clientEmail,
                phone: clientPhone,
                total_price: amount / 100,
                source: "alojamentoideal.pt",
                status: "pending",
                note: clientNotes,
                guests: property.adults + property.children,
                pets: property.pets,
                fees: property.fees,
            },
            undefined,
            undefined
        );


        const { success, client_secret, id } = await fetchClientSecret(
            amount,
            clientName,
            clientEmail,
            clientPhone,
            clientNotes,
            [reservation.reservation.id]
        );

        const transaction = await hostifyRequest<{ success: boolean, transaction: { id: number } }>(
            "transactions",
            "POST",
            undefined,
            {
                reservation_id: reservation.reservation.id,
                amount: amount / 100,
                currency: "EUR",
                charge_date: format(new Date(), "yyyy-MM-dd"),
                is_completed: 0,
                type: "accommodation",
            }
        );

        const { success: order_success, orderId } = await registerOrder({
            name: clientName,
            email: clientEmail,
            phoneNumber: clientPhone,
            notes: clientNotes,
            reservationIds: [reservation.reservation.id.toString()],
            reservationReferences: [reservation.reservation.confirmation_code],
            items: [property],
            payment_id: id || "",
            transaction_id: [transaction.transaction.id.toString()]
        });


        return { success: success && order_success, client_secret, payment_id: id, reservation, transaction, order_id: orderId };
    } catch (error) {
        return { success: false, message: error };
    }

}