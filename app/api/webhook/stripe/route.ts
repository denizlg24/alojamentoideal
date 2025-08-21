import { stripe } from "@/lib/stripe";
import OrderModel from "@/models/Order";
import { hostifyRequest } from "@/utils/hostify-request";
import { format } from "date-fns";
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
        switch (event.type) {
            case 'payment_intent.succeeded':
                const payment_id = event.data.object.id;
                const foundOrder = await OrderModel.findOne({ payment_id });
                if (foundOrder) {
                    for (const transactionId of foundOrder.transaction_id) {
                        await hostifyRequest<{ success: boolean }>(
                            `transactions/${transactionId}`,
                            "PUT",
                            undefined,
                            {
                                arrival_date: format(new Date(), "yyyy-MM-dd"),
                                is_completed: 1,
                                details: `Stripe completed payment_id: ${payment_id}`
                            },
                            undefined,
                            undefined
                        );
                    }
                    for (const reservationId of foundOrder.reservationIds) {
                        await hostifyRequest<{ success: boolean }>(
                            `reservations/${reservationId}`,
                            "PUT",
                            undefined,
                            {
                                status: "accepted",
                            },
                            undefined,
                            undefined
                        );
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
        return new Response('Webhook handler failed. View logs.', {
            status: 400
        });
    }

    return new Response(JSON.stringify({ received: true }));

}