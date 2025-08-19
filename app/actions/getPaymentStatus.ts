"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { verifySession } from "@/utils/verifySession";


export async function getPaymentStatus(payment_id: string) {
    if (!(await verifySession())) {
        throw new Error("Unauthorized")
    }
    const session = await auth();
    if (!session) {
        throw new Error("Unauthorized")
    }
    const intent = await stripe.paymentIntents.retrieve(payment_id);
    if (intent) {
        return intent.status;
    }
    return "not-found"
}