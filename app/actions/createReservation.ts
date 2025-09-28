"use server"

import { hostifyRequest } from "@/utils/hostify-request";
import { fetchClientSecret } from "./stripe";
import { calculateAmount } from "./calculateAmount";
import { ReservationType } from "@/schemas/reservation.schema";
import { AccommodationItem } from "@/hooks/cart-context";
import { format } from "date-fns";
import { registerOrder } from "./createOrder";
import { verifySession } from "@/utils/verifySession";
import { generateUniqueId } from "@/lib/utils";
import { ChatModel } from "@/models/Chat";
import GuestDataModel, { Guest } from "@/models/GuestData";
import { connectDB } from "@/lib/mongodb";

export async function purchaseAccommodation({ property, clientName, clientEmail, clientPhone, clientNotes, clientAddress, clientTax, isCompany, companyName,guest_data }: {
    property: AccommodationItem, clientName: string, clientEmail: string, clientPhone: string, clientNotes?: string, clientAddress: {
        line1: string;
        line2: string | null;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    }, clientTax?: string, isCompany: boolean, companyName?: string, guest_data:Guest[]
}) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
    }
    try {
        await connectDB();
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
                total_price: amount.total /100,
                source: "alojamentoideal.pt",
                status: "pending",
                note: clientNotes,
                guests: property.adults + property.children,
                pets: property.pets,
                fees: amount.fees,
            },
            undefined,
            undefined
        );


        const { success, client_secret, id } = await fetchClientSecret(
            {alojamentoIdeal:amount.total, detours:0},
            clientName,
            clientEmail,
            clientPhone,
            clientNotes,
            [reservation.reservation.id],
            clientAddress,
        );

        const transaction = await hostifyRequest<{ success: boolean, transaction: { id: number } }>(
            "transactions",
            "POST",
            undefined,
            {
                reservation_id: reservation.reservation.id,
                amount: amount.total/100,
                currency: "EUR",
                charge_date: format(new Date(), "yyyy-MM-dd"),
                is_completed: 0,
                type: "accommodation",
            }
        );

        const newProperty = { ...property };
        const { success: order_success, orderId } = await registerOrder({
            name: clientName,
            email: clientEmail,
            phoneNumber: clientPhone,
            notes: clientNotes,
            reservationIds: [reservation.reservation.id.toString()],
            reservationReferences: [reservation.reservation.confirmation_code],
            items: [newProperty],
            payment_id: id || "",
            transaction_id: [transaction.transaction.id.toString()],
            payment_method_id: "",
            tax_number: clientTax,
            isCompany,
            companyName
        });

        const newChatId = generateUniqueId();

        const newChat = new ChatModel({
            chat_id: newChatId,
            reservation_id: reservation.reservation.id.toString(),
            booking_reference: reservation.reservation.confirmation_code,
            lastMessage: "",
            unread: 0,
            automation_done: false,
            guest_name: clientName,
            status: "open"
        });

        const newGuestData = new GuestDataModel({ booking_code:reservation.reservation.confirmation_code, listing_id:reservation.reservation.listing_id, guest_data, synced: false, succeeded: false });
        await newGuestData.save();

        await newChat.save();
        return { success: success && order_success, client_secret, payment_id: id, reservation, transaction, order_id: orderId };
    } catch (error) {
        return { success: false, message: error };
    }

}