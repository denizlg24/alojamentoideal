"use server";
import { stripe } from "@/lib/stripe";
import { verifySession } from "@/utils/verifySession";


export async function getPaymentMethod(payment_id: string) {
    if (!(await verifySession())) {
        throw new Error("Unauthorized")
    }
    const intent = await stripe.paymentMethods.retrieve(payment_id);
    return JSON.parse(JSON.stringify(intent));
}