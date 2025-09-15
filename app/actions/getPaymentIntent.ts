"use server";
import { stripe } from "@/lib/stripe";
import { PaymentIntent } from "@stripe/stripe-js";
import Stripe from "stripe";


export async function getPaymentIntent(payment_id: string): Promise<{ intent: PaymentIntent, charge?: Stripe.Charge }> {
    const intent = await stripe.paymentIntents.retrieve(payment_id);
    if (intent.latest_charge && typeof intent.latest_charge === "string") {
        const charge = await stripe.charges.retrieve(intent.latest_charge);
        return { intent: JSON.parse(JSON.stringify(intent)), charge: JSON.parse(JSON.stringify(charge)) }
    }
    return { intent: JSON.parse(JSON.stringify(intent)) }
}