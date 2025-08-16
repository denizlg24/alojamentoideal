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
        if (!sig || !webhookSecret) return;
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch {
        return new Response(`Webhook error.`, { status: 400 });
    }

    console.log("GOT WEBHOOK EVENT: ", event.type);

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                const payment_id = event.data.object.id;
                const foundOrder = await OrderModel.findOne({ payment_id });
                if (foundOrder) {
                    for (const transactionId of foundOrder.transaction_id) {
                        console.log("GOT TRANSACTION_ID: ", transactionId)
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
                        console.log("GOT RESERVATION_ID: ", reservationId)
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