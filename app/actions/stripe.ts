'use server'

import { stripe } from '../../lib/stripe'

export async function fetchClientSecret(amount: number) {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "eur",
        });

        return { success: true, client_secret: paymentIntent.client_secret };
    } catch (error) {
        console.log(error);
        return { success: false, client_secret: null };
    }
}