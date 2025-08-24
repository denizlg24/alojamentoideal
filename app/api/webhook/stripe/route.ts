import { connectDB } from "@/lib/mongodb";
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
        await connectDB();
        switch (event.type) {
            case 'payment_intent.succeeded':
                const payment_id = event.data.object.id;
                const foundOrder = await OrderModel.findOne({ payment_id });
                const payment_method_id = event.data.object.payment_method;
                if (foundOrder) {
                    if (typeof payment_method_id === "string") {
                        foundOrder.updateOne({ payment_method_id: payment_method_id });
                        await foundOrder.save();
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Response('Webhook handler failed. View logs.' + (error as any).toString(), {
            status: 400
        });
    }

    return new Response(JSON.stringify({ received: true }));

}