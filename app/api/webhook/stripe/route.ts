import { attachInvoice } from "@/app/actions/attachInvoice";
import { createHouseInvoice } from "@/app/actions/createHouseInvoice";
import { getHtml } from "@/app/actions/getHtml";
import { sendMail } from "@/app/actions/sendMail";
import {CartItem } from "@/hooks/cart-context";
import { connectDB } from "@/lib/mongodb";
import { stripe } from "@/lib/stripe";
import OrderModel from "@/models/Order";
import { bokunRequest } from "@/utils/bokun-server";
import env from "@/utils/env";
import { hostifyRequest } from "@/utils/hostify-request";
import { ok } from "assert";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
import Mail from "nodemailer/lib/mailer";
import Stripe from "stripe";

const webhookSecret = env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {

    const body = await req.text();
    const sig = req.headers.get('stripe-signature')

    let event: Stripe.Event;
    try {
        if (!sig || !webhookSecret) return new Response(`Webhook error.`, { status: 400 });;
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch {
        return new Response(`Webhook error.`, { status: 400 });
    }

    try {
        await connectDB();
        switch (event.type) {
            case 'transfer.created':
                const destinationAccountId = event.data.object.destination as string;
                const destination_payment = event.data.object.destination_payment as string;
                const original_payment_id = event.data.object.transfer_group?.split('group_')[1];
                if (original_payment_id && destination_payment) {
                    const transferOrder = await OrderModel.findOne({ payment_id: original_payment_id });
                    if (transferOrder) {
                        try {
                            await stripe.charges.update(
                                destination_payment,
                                {
                                    description: `${transferOrder?.name} - Activity Booking - ${transferOrder?.activityBookingReferences?.join(", ")}`,
                                    metadata: {
                                        "Alojamento Ideal - Payment Intent ID": original_payment_id,
                                        "Alojamento Ideal - Order Id": transferOrder.orderId,
                                        "Client Name": transferOrder.name,
                                        "Client Email": transferOrder.email,
                                        "Client Phone Number": transferOrder.phoneNumber,
                                        "Notes": transferOrder.notes ?? "No notes."
                                    },
                                },
                                { stripeAccount: destinationAccountId }
                            );
                        } catch (error) {
                            console.log(error);
                        }

                    }
                }
                break;
            case 'payment_intent.succeeded':
                const payment_id = event.data.object.id;
                const chargeID = event.data.object.latest_charge as string;
                const charge = await stripe.charges.retrieve(chargeID);
                const foundOrder = await OrderModel.findOne({ payment_id });
                const payment_method_id = event.data.object.payment_method;
                if (foundOrder) {

                    if (typeof payment_method_id === "string") {
                        await OrderModel.findOneAndUpdate({ payment_id }, { payment_method_id });
                    }

                    const reservation_update_response = await confirmReservations({ reservationIds: foundOrder.reservationIds, transaction_ids: foundOrder.transaction_id, payment_id })
                    console.log(reservation_update_response);

                    if (charge.paid && charge.status === "succeeded") {
                        if (foundOrder.activityBookingReferences && charge.transfer_data) {
                            const booking_confirm_response = await confirmActivities({ charge, activityBookingReferences: foundOrder.activityBookingReferences, order_id: foundOrder.orderId });
                            console.log(booking_confirm_response);
                        }

                        const order_email_html = await buildOrderEmail({ plainItems: foundOrder.items, order_id: foundOrder.orderId,reservationReferences:foundOrder.reservationReferences,activityBookingIds:foundOrder.activityBookingIds });
                        const order_attachments = await buildAttachments({ activityBookingIds: foundOrder.activityBookingIds ?? [], activityBookingReferences: foundOrder.activityBookingReferences ?? [] })
                        const email_sent = await sendOrderEmail({ email: foundOrder.email, orderHtml: order_email_html, attachments: order_attachments, order_id: foundOrder.orderId });
                        console.log(`Email sent = ${email_sent.success}`);

                        if (foundOrder && foundOrder.reservationIds.length > 0) {
                            const updatedCart = await issueInvoices({ reservationIds: foundOrder.reservationIds, reservationReferences: foundOrder.reservationReferences, items: foundOrder.items, userInfo: { email: foundOrder.email, name: foundOrder.name, companyName: foundOrder.companyName, tax_number: foundOrder.tax_number, isCompany: foundOrder.isCompany }, charge,order_id:foundOrder.orderId })
                            console.log("Updated cart: ",updatedCart);
                        }
                    }

                }
                break;
            case 'payment_intent.payment_failed':
                const failed_payment_id = event.data.object.id;
                const failed_foundOrder = await OrderModel.findOneAndDelete({ payment_id: failed_payment_id });
                if (failed_foundOrder) {
                    for (const reservationId of failed_foundOrder.reservationIds) {
                        await hostifyRequest<{ success: boolean }>(
                            `reservations/${reservationId}`,
                            "PUT",
                            undefined,
                            {
                                status: "denied",
                            },
                            undefined,
                            undefined
                        );
                    }
                }
                break;
            default:
                break;
        }
    } catch (error) {
        console.log(error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Response('Webhook handler failed. View logs.' + (error as any).toString(), {
            status: 400
        });
    }

    return new Response(JSON.stringify({ received: true }));
}

const confirmReservations = async ({ reservationIds, transaction_ids, payment_id }: { reservationIds: string[], transaction_ids: string[], payment_id: string }) => {
    const reservation_successes: Record<string, boolean> = {};
    for (let index = 0; index < reservationIds.length; index++) {
        const reservation_id = reservationIds[index];
        const transaction_id = transaction_ids[index];

        const [reservation_request,] = await Promise.all([
            hostifyRequest<{ success: boolean }>(
                `reservations/${reservation_id}`,
                "PUT",
                undefined,
                {
                    status: "accepted",
                },
                undefined,
                undefined
            ), hostifyRequest<{ success: boolean }>(
                `transactions/${transaction_id}`,
                "PUT",
                undefined,
                {
                    arrival_date: format(new Date(), "yyyy-MM-dd"),
                    is_completed: 1,
                    details: `Stripe completed payment_id: ${payment_id}`
                },
                undefined,
                undefined
            )
        ])
        if (!reservation_request.success) {
            reservation_successes[reservation_id] = false;
            continue;
        }
        reservation_successes[reservation_id] = true;
    }
    return reservation_successes;
}

const confirmActivities = async ({ charge, activityBookingReferences, order_id }: { charge: Stripe.Charge, activityBookingReferences: string[], order_id: string }) => {
    ok(charge.transfer_data);
    const reservation_successes: Record<string, boolean> = {};
    for (let index = 0; index < activityBookingReferences.length; index++) {
        const bookingCode = activityBookingReferences[index];
        const confirmationResponse = await bokunRequest<{ travelDocuments: { invoice: string, activityTickets: { bookingId: string, productTitle: string, productConfirmationCode: string, ticket: string }[] } }>({
            method: "POST", path: `/checkout.json/confirm-reserved/${bookingCode}`, body: {
                externalBookingReference: order_id,
                externalBookingEntityName: "Alojamento Ideal",
                sendNotificationToMainContact: false,
                transactionDetails: {
                    transactionDate: format(new Date, "yyyy-MM-dd"),
                    transactionId: charge.id,
                    cardBrand: charge.payment_method_details?.card?.brand ?? 'Bank',
                    last4: charge.payment_method_details?.card?.last4 ?? '',
                },
                amount: (charge.transfer_data.amount ?? charge.amount) / 100,
                currency: charge?.currency.toUpperCase()
            }
        })
        if (!confirmationResponse.success) {
            reservation_successes[bookingCode] = false;
            continue;
        }
        reservation_successes[bookingCode] = true;
    }
    return reservation_successes;
}

const issueInvoices = async ({ reservationIds, reservationReferences, items, userInfo, charge, order_id }: {
    reservationIds: string[], reservationReferences: string[], items: CartItem[], userInfo: {
        isCompany?: boolean,
        email: string,
        companyName?: string,
        name: string,
        tax_number?: string
    }, charge: Stripe.Charge, order_id:string
}) => {
    const t = await getTranslations("order-email");
    for (let index = 0; index < reservationIds.length; index++) {
        const reservationCode = reservationReferences[index];
        const orderItem = items.filter((item) => item.type == 'accommodation')[index];
        const order_index = items.findIndex((item) => item == orderItem);
        const itemInvoice = await createHouseInvoice({ item: orderItem, clientName: userInfo.isCompany ? (userInfo.companyName || userInfo.name) : userInfo.name, clientTax: userInfo.tax_number, booking_code: reservationCode, clientAddress: charge.billing_details.address ?? undefined })
        if (itemInvoice.url && itemInvoice.id) {
            const nights =
                (new Date(orderItem.end_date!).getTime() -
                    new Date(orderItem.start_date!).getTime()) /
                (1000 * 60 * 60 * 24);
            const productHtml = await getHtml('emails/order-product.html', [{ '{{product_name}}': orderItem.name }, {
                '{{product_description}}': t("nights", {
                    count:
                        nights,
                    adults: orderItem.adults!,
                    children:
                        orderItem.children! > 0 ? t("children_text", { count: orderItem.children! }) : "",
                    infants:
                        orderItem.infants! > 0 ? t("infants_text", { count: orderItem.infants! }) : "",
                })
            }, { '{{product_quantity}}': t("reservation", { number: reservationCode }) }, { "{{product_price}}": `${orderItem.front_end_price ?? 0}€` }, { "{{product_photo}}": orderItem.photo }])

            const orderHtml = await getHtml('emails/invoice-sent-email.html',
                [{ "{{products_html}}": productHtml },
                { "{{your-invoice-is-ready}}": t('your-invoice-is-ready') },
                { "{{view-your-invoice}}": t('view-your-invoice') },
                { "{{order-number}}": t('reservation-number', { order_id: reservationCode }) },
                { '{{invoice_url}}': itemInvoice.url }
                ])
            const success = await attachInvoice({orderId:order_id,index:order_index,invoice_url:{url:itemInvoice.url, id:itemInvoice.id}})
           
            await sendMail({
                email: userInfo.email,
                html: orderHtml,
                subject: t('invoice-for-reservation', { order_id: reservationCode }),
            });
           return success;
        }
    }
    return true;
}

const buildOrderEmail = async ({ plainItems, order_id,reservationReferences,activityBookingIds }: { plainItems: CartItem[], order_id: string;reservationReferences:string[],activityBookingIds?:string[] }) => {
    const t = await getTranslations("order-email");
    const total = plainItems.reduce((prev, i) => {
        return i.type == "accommodation" ? prev + (i.front_end_price ?? 0) : i.type == 'activity' ? prev + (i.price ?? 0) : prev + ((i.price ?? 0) * (i.quantity ?? 0))
    }, 0);
    let products_html = ""
    let a = 0, b = 0;
    for (const i of plainItems) {
        if (i.type == "accommodation") {
            const nights =
                (new Date(i.end_date!).getTime() -
                    new Date(i.start_date!).getTime()) /
                (1000 * 60 * 60 * 24);
            const productHtml = await getHtml('emails/order-product.html', [{ '{{product_name}}': i.name }, {
                '{{product_description}}': t("nights", {
                    count:
                        nights,
                    adults: i.adults!,
                    children:
                        i.children! > 0 ? t("children_text", { count: i.children! }) : "",
                    infants:
                        i.infants! > 0 ? t("infants_text", { count: i.infants! }) : "",
                })
            }, { '{{product_quantity}}': t("reservation", { number: reservationReferences[a] }) }, { "{{product_price}}": `${i.front_end_price ?? 0}€` }, { "{{product_photo}}": i.photo }])
            products_html += productHtml;
            a++;
        }
        if (i.type == 'activity') {
            ok(activityBookingIds);
            const productHtml = await getHtml('emails/order-product.html', [{ '{{product_name}}': i.name }, {
                '{{product_description}}': t("tour-date", {
                    startDate: format(i.selectedDate, "MMMM dd, yyyy")
                })
            }, { '{{product_quantity}}': t("reservation", { number: activityBookingIds![b] }) }, { "{{product_price}}": `${i.price ?? 0}€` }, { "{{product_photo}}": i.photo }])
            products_html += productHtml;
            b++;
        }
    }
    const orderHtml = await getHtml('emails/order-confirmed-email.html',
        [{ "{{products_html}}": products_html },
        { "{{your-order-is-in}}": t('your-order-is-in') },
        { "{{view-your-order}}": t('view-your-order') },
        { "{{order-title}}": t('order-title') },
        { "{{order-number}}": t('order-number', { order_id: order_id }) },
        { "{{order-total}}": 'Total:' },
        { "{{total_price}}": `${total}€` },
        { '{{order_url}}': `${env.SITE_URL}/orders/${order_id}` }
        ])
    return orderHtml;
}

const buildAttachments = async ({ activityBookingIds, activityBookingReferences }: { activityBookingIds: string[], activityBookingReferences: string[] }) => {
    const attachments: Mail.Attachment[] = [];
    if (activityBookingIds && activityBookingIds.length > 0) {
        const parentBooking = activityBookingReferences![0];
        for (let index = 0; index < activityBookingIds.length; index++) {
            const element = activityBookingIds[index];
            const ticketResponse = await bokunRequest<{ data: string }>({
                method: "GET",
                path: `/booking.json/activity-booking/${element}/ticket`,
            });
            if (ticketResponse.success) {
                attachments.push({ filename: `${element} Ticket.pdf`, content: ticketResponse.data, encoding: 'base64' })
            }

        }
        const invoiceResponse = await bokunRequest<{ data: string }>({
            method: "GET",
            path: `/booking.json/${parentBooking.split('-')[1]}/summary`,
        });
        if (invoiceResponse.success) {
            attachments.push({ filename: `${parentBooking} Invoice.pdf`, content: invoiceResponse.data, encoding: 'base64' })
        }
    }
    return attachments;
}

const sendOrderEmail = async ({ email, orderHtml, attachments, order_id }: { email: string, orderHtml: string, attachments: Mail.Attachment[], order_id: string }) => {
    const t = await getTranslations("order-email");
    return await sendMail({
        email: email,
        html: orderHtml,
        subject: t('order-number', { order_id: order_id }),
        attachments
    });
}