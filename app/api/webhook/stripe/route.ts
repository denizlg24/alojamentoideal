import { createHouseInvoice } from "@/app/actions/createHouseInvoice";
import { getHtml } from "@/app/actions/getHtml";
import { sendMail } from "@/app/actions/sendMail";
import { CartItem } from "@/hooks/cart-context";
import { connectDB } from "@/lib/mongodb";
import { stripe } from "@/lib/stripe";
import OrderModel from "@/models/Order";
import { bokunRequest } from "@/utils/bokun-server";
import env from "@/utils/env";
import { hostifyRequest } from "@/utils/hostify-request";
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
        const t = await getTranslations("order-email");
        await connectDB();
        switch (event.type) {
            case 'charge.succeeded':
                const charge = event.data.object;
                if (charge.paid && charge.status === "succeeded") {
                    const chargePaymentId = charge.payment_intent as string;
                    const foundOrder = await OrderModel.findOne({ payment_id: chargePaymentId }).lean();
                    if (!foundOrder) {
                        break;
                    }
                    const newCart: CartItem[] = [...foundOrder.items.filter((item) => item.type != "accommodation")];
                    if (foundOrder && foundOrder.activityBookingReferences && charge.transfer_data) {
                        for (let index = 0; index < foundOrder.activityBookingReferences.length; index++) {
                            const bookingCode = foundOrder.activityBookingReferences[index];
                            const confirmationResponse = await bokunRequest<{ travelDocuments: { invoice: string, activityTickets: { bookingId: string, productTitle: string, productConfirmationCode: string, ticket: string }[] } }>({
                                method: "POST", path: `/checkout.json/confirm-reserved/${bookingCode}`, body: {
                                    externalBookingReference: foundOrder.orderId,
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
                                continue;
                            }
                            console.log(confirmationResponse.travelDocuments);
                        }
                    }
                    if (foundOrder && foundOrder.reservationIds.length > 0) {
                        for (let index = 0; index < foundOrder.reservationIds.length; index++) {
                            const reservationCode = foundOrder.reservationReferences[index];
                            const orderItem = foundOrder.items.filter((item) => item.type == 'accommodation')[index];
                            const itemInvoice = await createHouseInvoice({ item: orderItem, clientName: foundOrder.isCompany ? (foundOrder.companyName || foundOrder.name) : foundOrder.name, clientTax: foundOrder.tax_number, booking_code: reservationCode, clientAddress: event.data.object.billing_details.address ?? undefined })
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

                                await sendMail({
                                    email: foundOrder.email,
                                    html: orderHtml,
                                    subject: t('invoice-for-reservation', { order_id: reservationCode }),
                                });
                            }
                            newCart.push({ ...orderItem, invoice: itemInvoice.url, invoice_id: itemInvoice.id });
                        }
                    }
                    const updatedOrder = await OrderModel.findOneAndUpdate({ payment_id: chargePaymentId }, { items: newCart });
                    console.log(updatedOrder);
                }
                break;
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
                const foundOrder = await OrderModel.findOne({ payment_id });
                const payment_method_id = event.data.object.payment_method;
                if (foundOrder) {
                    if (typeof payment_method_id === "string") {
                        await OrderModel.findOneAndUpdate({ payment_id }, { payment_method_id });
                    }
                    for (let index = 0; index < foundOrder.reservationIds.length; index++) {
                        const reservation_id = foundOrder.reservationIds[index];
                        const transaction_id = foundOrder.transaction_id[index];

                        const [reservation_request, transaction_request] = await Promise.all([
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
                        console.log("reservation update: ", reservation_request, " transaction_update", transaction_request);
                    }
                    const plainItems = foundOrder.items;
                    const total = plainItems.reduce((prev, i) => {
                        return i.type == "accommodation" ? prev + (i.front_end_price ?? 0) : i.type == 'activity' ? prev + (i.price ?? 0) : prev + ((i.price ?? 0) * (i.quantity ?? 0))
                    }, 0)
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
                            }, { '{{product_quantity}}': t("reservation", { number: foundOrder.reservationReferences[a] }) }, { "{{product_price}}": `${i.front_end_price ?? 0}€` }, { "{{product_photo}}": i.photo }])
                            products_html += productHtml;
                            a++;
                        }
                        if (i.type == 'activity') {
                            const productHtml = await getHtml('emails/order-product.html', [{ '{{product_name}}': i.name }, {
                                '{{product_description}}': t("tour-date", {
                                    startDate: format(i.selectedDate, "MMMM dd, yyyy")
                                })
                            }, { '{{product_quantity}}': t("reservation", { number: foundOrder.activityBookingIds![b] }) }, { "{{product_price}}": `${i.price ?? 0}€` }, { "{{product_photo}}": i.photo }])
                            products_html += productHtml;
                            b++;
                        }

                    }
                    const orderHtml = await getHtml('emails/order-confirmed-email.html',
                        [{ "{{products_html}}": products_html },
                        { "{{your-order-is-in}}": t('your-order-is-in') },
                        { "{{view-your-order}}": t('view-your-order') },
                        { "{{order-title}}": t('order-title') },
                        { "{{order-number}}": t('order-number', { order_id: foundOrder.orderId }) },
                        { "{{order-total}}": 'Total:' },
                        { "{{total_price}}": `${total}€` },
                        { '{{order_url}}': `${env.SITE_URL}/orders/${foundOrder.orderId}` }
                        ])
                    const attachments: Mail.Attachment[] = [];
                    if (foundOrder && foundOrder.activityBookingIds && foundOrder.activityBookingIds.length > 0) {
                        const parentBooking = foundOrder.activityBookingReferences![0];
                        for (let index = 0; index < foundOrder.activityBookingIds.length; index++) {
                            const element = foundOrder.activityBookingIds[index];
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
                    await sendMail({
                        email: foundOrder.email,
                        html: orderHtml,
                        subject: t('order-number', { order_id: foundOrder.orderId }),
                        attachments
                    });
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