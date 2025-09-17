"use server"

import { AccommodationItem, CartItem } from "@/hooks/cart-context";
import { verifySession } from "@/utils/verifySession";
import { calculateAmount } from "./calculateAmount";
import { ReservationType } from "@/schemas/reservation.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { format } from "date-fns";
import { registerOrder } from "./createOrder";
import { fetchClientSecret } from "./stripe";
import { generateReservationID, generateUniqueId } from "@/lib/utils";
import { ChatModel } from "@/models/Chat";
import { connectDB } from "@/lib/mongodb";
import { bokunRequest, FullExperienceType } from "@/utils/bokun-requests";
//import { createHouseInvoice } from "./createHouseInvoice";

export async function buyCart({ cart, clientName, clientEmail, clientPhone, clientNotes, clientAddress, clientTax, isCompany, companyName, mainContactDetails, activityBookings }: {
    cart: CartItem[], clientName: string, clientEmail: string, clientPhone: string, clientNotes?: string, clientAddress: {
        line1: string;
        line2: string | null;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    }, clientTax?: string, isCompany: boolean, companyName?: string, mainContactDetails?: { questionId: string, values: string[] }[],
    activityBookings?: { activityId: number, answers: { questionId: string, values: string[] }[], pickupAnswers: { questionId: string, values: string[] }[], rateId: number, startTimeId: number | undefined, date: string, pickup: boolean, pickupPlaceId: string | undefined, passengers: { pricingCategoryId: number, groupSize: number, passengerDetails: { questionId: string, values: string[] }[], answers: { questionId: string, values: string[] }[] }[] }[],
}) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
    }
    try {
        await connectDB();
        const amount = await calculateAmount(cart);
        let tourAmount = 0;
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
                    listing_id: (property as AccommodationItem).property_id,
                    start_date: (property as AccommodationItem).start_date,
                    end_date: (property as AccommodationItem).end_date,
                    name: clientName,
                    email: clientEmail,
                    phone: clientPhone,
                    total_price: property_amount / 100,
                    source: "alojamentoideal.pt",
                    status: "pending",
                    note: clientNotes,
                    guests: (property as AccommodationItem).adults + (property as AccommodationItem).children,
                    pets: (property as AccommodationItem).pets,
                    fees: (property as AccommodationItem).fees,
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
        let bokunResponse: { success: false, message: string } | {
            success: true,
            booking: {
                activityBookings: [{
                    bookingId: number;
                    parentBookingId: number;
                    confirmationCode: string;
                    productConfirmationCode: string;
                    barcode: {
                        value: string;
                        barcodeType: "QR_CODE" | "CODE_128" | "PDF_417" | "DATA_MATRIX" | "AZTEC";
                    };
                    hasTicket: boolean;
                    boxBooking: boolean;
                    startDateTime: number;
                    endDateTime: number;
                    status: "CART" | "REQUESTED" | "RESERVED" | "CONFIRMED" | "TIMEOUT" | "ABORTED" | "CANCELLED" | "ERROR" | "ARRIVED" | "NO_SHOW" | "REJECTED";
                    includedOnCustomerInvoice: boolean;
                    title: string;
                    totalPrice: number;
                    priceWithDiscount: number;
                    totalPriceAsText: string;
                    priceWithDiscountAsText: string;
                    discountPercentage: number;
                    discountAmount: number;
                    paidType: "PAID_IN_FULL" | "DEPOSIT" | "FREE" | "NOT_PAID" | "OVERPAID" | "REFUND" | "INVOICED" | "GIFT_CARD";
                    activity: FullExperienceType;
                }];
                totalPrice: number;
                status: "CART" | "REQUESTED" | "RESERVED" | "CONFIRMED" | "TIMEOUT" | "ABORTED" | "CANCELLED" | "ERROR" | "ARRIVED" | "NO_SHOW" | "REJECTED";
                confirmationCode: string;
                bookingId: number;
            };
        } = { success: false, message: "no-tour-items" };
        if (cart.filter((item) => item.type == 'activity').length > 0) {
            const randomOrderId = generateReservationID();
            bokunResponse = await bokunRequest<{
                booking: {
                    activityBookings: [{
                        bookingId: number,
                        parentBookingId: number,
                        confirmationCode: string,
                        productConfirmationCode: string,
                        barcode: { value: string, barcodeType: "QR_CODE" | "CODE_128" | "PDF_417" | "DATA_MATRIX" | "AZTEC" },
                        hasTicket: boolean,
                        boxBooking: boolean,
                        startDateTime: number,
                        endDateTime: number,
                        status: "CART" | "REQUESTED" | "RESERVED" | "CONFIRMED" | "TIMEOUT" | "ABORTED" | "CANCELLED" | "ERROR" | "ARRIVED" | "NO_SHOW" | "REJECTED",
                        includedOnCustomerInvoice: boolean,
                        title: string,
                        totalPrice: number,
                        priceWithDiscount: number,
                        totalPriceAsText: string,
                        priceWithDiscountAsText: string,
                        discountPercentage: number,
                        discountAmount: number,
                        paidType: "PAID_IN_FULL" | "DEPOSIT" | "FREE" | "NOT_PAID" | "OVERPAID" | "REFUND" | "INVOICED" | "GIFT_CARD",
                        activity: FullExperienceType,

                    }],
                    totalPrice: number, status: "CART" | "REQUESTED" | "RESERVED" | "CONFIRMED" | "TIMEOUT" | "ABORTED" | "CANCELLED" | "ERROR" | "ARRIVED" | "NO_SHOW" | "REJECTED", confirmationCode: string, bookingId: number
                },
            }>({
                method: "POST",
                path: `/checkout.json/submit`,  //17816 //?trackingCode=774327a1896b423b8f6a13b24095ec80
                body: { 
                    checkoutOption: 'CUSTOMER_FULL_PAYMENT',
                    directBooking: {
                        mainContactDetails,
                        activityBookings,
                        externalBookingReference: randomOrderId,
                        externalBookingEntityName: 'Alojamento Ideal',
                    },
                    sendNotificationToMainContact: false,
                    paymentMethod: 'RESERVE_FOR_EXTERNAL_PAYMENT',
                    checkoutOptionAnswers: [],
                    source: 'DIRECT_REQUEST'
                },
            });
            if (!bokunResponse.success) {
                return { success: false }
            }
            tourAmount += bokunResponse.booking.totalPrice * 100;
        }

        console.log(bokunResponse);

        const { success, client_secret, id } = await fetchClientSecret(
            {alojamentoIdeal:amount,detours:tourAmount},
            clientName,
            clientEmail,
            clientPhone,
            clientNotes,
            reservationIds,
            clientAddress,
            bokunResponse.success ? [bokunResponse.booking.confirmationCode.toString()] : []
        );

        const { success: order_success, orderId } = await registerOrder({
            name: clientName,
            email: clientEmail,
            phoneNumber: clientPhone,
            notes: clientNotes,
            reservationIds: reservationIds.map((r) => r.toString()),
            reservationReferences: reservationReferences.map((r) => r.toString()),
            items: [...newCart,...cart.filter((item) => item.type == 'activity')],
            payment_id: id || "",
            transaction_id: transactionIds.map((t) => t.toString()),
            payment_method_id: "",
            tax_number: clientTax,
            isCompany,
            companyName,
            activityBookingIds: bokunResponse.success ? bokunResponse.booking.activityBookings.map((activity) => activity.productConfirmationCode) : [],
            activityBookingReferences: bokunResponse.success ? [bokunResponse.booking.confirmationCode] : []
        });

        return { success: success && order_success, client_secret, payment_id: id, order_id: orderId };
    } catch {
        return { success: false };
    }
}