'use server'

import { verifySession } from '@/utils/verifySession';
import { stripe } from '../../lib/stripe'

export async function fetchClientSecret(amount: number, client_name: string, client_email: string, client_phone_number: string, notes: string, reservationIds: number[]) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
    }
    const commaSeparatedReservationIds = reservationIds.join(",");
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "eur",
            receipt_email: client_email,
            metadata: {
                client_name,
                client_email,
                client_phone_number,
                reservationIds: commaSeparatedReservationIds,
                notes,
            }
        });


        return { success: true, client_secret: paymentIntent.client_secret, id: paymentIntent.id };
    } catch {
        return { success: false, client_secret: null, id: null };
    }
}