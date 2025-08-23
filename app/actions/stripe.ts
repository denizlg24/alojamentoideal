'use server'

import { verifySession } from '@/utils/verifySession';
import { stripe } from '../../lib/stripe'

export async function fetchClientSecret(amount: number, client_name: string, client_email: string, client_phone_number: string, notes: string | undefined, reservationIds: number[]) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
    }

    const commaSeparatedReservationIds = reservationIds.join(",");
    try {
        const customer = await stripe.customers.create({
            name: client_name,
            email: client_email,
            phone: client_phone_number
        });
        console.log("Created customer: ", customer.id);
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "eur",
            automatic_payment_methods: {
                enabled: true,
            },
            statement_descriptor: "WWW.ALOJAMENTOIDEAL.PT",
            receipt_email: client_email,
            customer: customer.id,
            description: `${client_name} - ${commaSeparatedReservationIds} - accommodation`,
            metadata: {
                client_name,
                client_email,
                client_phone_number,
                reservationIds: commaSeparatedReservationIds,
                notes: notes || "",
            },
            setup_future_usage: "off_session"
        });
        console.log("Created payment_intent: ", paymentIntent.id);

        return { success: true, client_secret: paymentIntent.client_secret, id: paymentIntent.id };
    } catch (error) {
        console.log(error);
        return { success: false, client_secret: null, id: null };
    }
}