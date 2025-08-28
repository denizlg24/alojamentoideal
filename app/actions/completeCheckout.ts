"use server"

import { CartItem } from "@/hooks/cart-context";
import { verifySession } from "@/utils/verifySession";
import { calculateAmount } from "./calculateAmount";
import { ReservationType } from "@/schemas/reservation.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { format } from "date-fns";
import { registerOrder } from "./createOrder";
import { fetchClientSecret } from "./stripe";
import { generateUniqueId } from "@/lib/utils";
import { ChatModel } from "@/models/Chat";
import { connectDB } from "@/lib/mongodb";
//import { createHouseInvoice } from "./createHouseInvoice";

export async function buyCart({ cart, clientName, clientEmail, clientPhone, clientNotes, clientAddress, clientTax, isCompany, companyName }: {
    cart: CartItem[], clientName: string, clientEmail: string, clientPhone: string, clientNotes?: string, clientAddress: {
        line1: string;
        line2: string | null;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    }, clientTax?: string, isCompany: boolean, companyName?: string
}) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
    }
    try {
        await connectDB();
        const amount = await calculateAmount(cart);
        const amounts: number[] = []
        const reservationIds: number[] = [];
        const reservationReferences: string[] = [];
        const transactionIds: number[] = [];
        const newCart: CartItem[] = []
        for (const property of cart.filter((i) => i.type == "accommodation")) {
            const property_amount = await calculateAmount([property]);
            amounts.push(property_amount);
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
                    total_price: property_amount / 100,
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
            reservationIds.push(reservation.reservation.id);
            reservationReferences.push(reservation.reservation.confirmation_code);
            const transaction = await hostifyRequest<{ success: boolean, transaction: { id: number } }>(
                "transactions",
                "POST",
                undefined,
                {
                    reservation_id: reservation.reservation.id,
                    amount: property_amount / 100,
                    currency: "EUR",
                    charge_date: format(new Date(), "yyyy-MM-dd"),
                    is_completed: 0,
                    type: "accommodation",
                }
            );
            transactionIds.push(transaction.transaction.id);

            const newChatId = generateUniqueId()

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

            await newChat.save();

            //const itemInvoice = await createHouseInvoice({ item: property, clientName: isCompany ? (companyName || clientName) : clientName, clientTax, booking_code: reservation.reservation.confirmation_code, clientAddress })
            const newItem = { ...property, /*invoice: itemInvoice*/ };
            newCart.push(newItem);
        }

        const { success, client_secret, id } = await fetchClientSecret(
            amount,
            clientName,
            clientEmail,
            clientPhone,
            clientNotes,
            reservationIds,
            clientAddress,
        );

        const { success: order_success, orderId } = await registerOrder({
            name: clientName,
            email: clientEmail,
            phoneNumber: clientPhone,
            notes: clientNotes,
            reservationIds: reservationIds.map((r) => r.toString()),
            reservationReferences: reservationReferences.map((r) => r.toString()),
            items: newCart,
            payment_id: id || "",
            transaction_id: transactionIds.map((t) => t.toString()),
            payment_method_id: "",
            tax_number: clientTax,
            isCompany,
            companyName
        });

        return { success: success && order_success, client_secret, payment_id: id, order_id: orderId };
    } catch {
        return { success: false };
    }
}