import { getHtml } from "@/app/actions/getHtml";
import { getPaymentIntent } from "@/app/actions/getPaymentIntent";
import { sendMail } from "@/app/actions/sendMail";
import { connectDB } from "@/lib/mongodb";
import { stripe } from "@/lib/stripe";
import GuestDataModel from "@/models/GuestData";
import OrderModel from "@/models/Order";
import { bokunRequest } from "@/utils/bokun-requests";
import { hostifyRequest } from "@/utils/hostify-request";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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
            case 'payment_intent.succeeded':
                const payment_id = event.data.object.id;
                const foundOrder = await OrderModel.findOne({ payment_id });
                const payment_method_id = event.data.object.payment_method;
                if (foundOrder) {
                    if (typeof payment_method_id === "string") {
                        console.log("Found payment method id: ", payment_method_id)
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
                    if(foundOrder.activityBookingReferences){
                        for (let index = 0; index < foundOrder.activityBookingReferences.length; index++) {
                            const bookingCode = foundOrder.activityBookingReferences[index];
                            const chargeResponse = await getPaymentIntent(payment_id);
                            if(!chargeResponse.charge){
                                continue;
                            }
                            const confirmationResponse = await bokunRequest({method:"POST",path:`/checkout.json/confirm-reserved/${bookingCode}`,body:{
                                externalBookingReference:foundOrder.orderId,
                                externalBookingEntityName:"Alojamento Ideal",
                                sendNotificationToMainContact:false,
                                transactionDetails:{
                                    transactionDate:format(new Date,"yyyy-MM-dd"),
                                    transactionId:chargeResponse.charge.id,
                                    cardBrand:chargeResponse.charge.payment_method_details?.card?.brand ?? 'Bank',
                                    last4:chargeResponse.charge.payment_method_details?.card?.last4 ?? '',
                                },
                                amount:chargeResponse.charge.amount/100,
                                currency:chargeResponse.charge.currency
                            }})
                            console.log(confirmationResponse);
                        }
                    }
                    
                    const plainItems = foundOrder.items;
                    const total = plainItems.reduce((prev, i) => {
                        return i.type == "accommodation" ? prev + (i.front_end_price ?? 0) : i.type == 'activity' ? prev + (i.price ?? 0) : prev + ((i.price ?? 0) * (i.quantity ?? 0))
                    }, 0)
                    let products_html = ""
                    let a = 0;
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

                    }
                    const orderHtml = await getHtml('emails/order-confirmed-email.html',
                        [{ "{{products_html}}": products_html },
                        { "{{your-order-is-in}}": t('your-order-is-in') },
                        { "{{view-your-order}}": t('view-your-order') },
                        { "{{order-title}}": t('order-title') },
                        { "{{order-number}}": t('order-number', { order_id: foundOrder.orderId }) },
                        { "{{order-total}}": 'Total:' },
                        { "{{total_price}}": `${total}€` },
                        { '{{order_url}}': `${process.env.SITE_URL}/orders/${foundOrder.orderId}` }
                        ])

                    await sendMail({
                        email: foundOrder.email,
                        html: orderHtml,
                        subject: t('order-number', { order_id: foundOrder.orderId }),
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
            case 'refund.created':
                const refund = event.data.object;
                const refund_payment_id = refund.payment_intent;
                if (refund_payment_id) {
                    const refund_foundOrder = await OrderModel.findOne({ payment_id: refund_payment_id });
                    if (refund_foundOrder) {
                        for (const reservationId of refund_foundOrder.reservationIds) {
                            await hostifyRequest<{ success: boolean }>(
                                `reservations/${reservationId}`,
                                "PUT",
                                undefined,
                                {
                                    status: "cancelled_by_guest",
                                },
                                undefined,
                                undefined
                            );

                        }
                        for (const booking_code of refund_foundOrder.reservationReferences) {
                            await GuestDataModel.findOneAndDelete({ booking_code });
                        }
                        for (const transactionId of refund_foundOrder.transaction_id) {
                            await hostifyRequest<{ success: boolean }>(
                                `transactions/${transactionId}`,
                                "PUT",
                                undefined,
                                {
                                    arrival_date: "",
                                    is_completed: 0,
                                    details: `Stripe refunded refund_id: ${refund.id}`
                                },
                                undefined,
                                undefined
                            );
                        }
                    }
                }
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