"use server";

import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { UnauthorizedError } from "@/lib/utils";
import { verifySession } from "@/utils/verifySession";


export async function getPaymentStatus(payment_id: string) {
    if (!(await verifySession())) {
        throw new UnauthorizedError();
    }
    const session = await auth();
    if (!session) {
        throw new UnauthorizedError();
    }
    const intent = await stripe.paymentIntents.retrieve(payment_id);
    if (intent) {
        return intent.status;
    }
    return "not-found"
}