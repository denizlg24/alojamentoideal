'use server'

import { verifySession } from '@/utils/verifySession';
import { stripe } from '../../lib/stripe'
import env from '@/utils/env';
import { UnauthorizedError } from '@/lib/utils';

export async function fetchClientSecret(amount: { alojamentoIdeal: number, detours: number }, client_name: string, client_email: string, client_phone_number: string, notes: string | undefined, reservationIds: number[], clientAddress: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}, activityBookings?: string[]) {
    if (!(await verifySession())) {
        throw new UnauthorizedError();
    }

    const commaSeparatedReservationIds = reservationIds.join(", ");
    const commaSeparatedActivityIds = activityBookings?.join(", ");
    try {
        const customer = await stripe.customers.create({
            name: client_name,
            email: client_email,
            phone: client_phone_number,
            address: { ...clientAddress, line2: clientAddress.line2 ?? undefined },
        });
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount.alojamentoIdeal + amount.detours,
            currency: "eur",
            automatic_payment_methods: {
                enabled: true,
            },
            statement_descriptor_suffix: "WWW.ALOJAMENTOIDEAL.PT",
            receipt_email: client_email,
            customer: customer.id,
            description: `${reservationIds.length > 0 ? `${client_name} - ${commaSeparatedReservationIds} - accommodation` : ''} ${(commaSeparatedActivityIds?.length ?? 0) > 0 ? `${client_name} - ${commaSeparatedActivityIds} - activity` : ''}`.trim(),
            metadata: {
                client_name,
                client_email,
                client_phone_number,
                reservationIds: commaSeparatedReservationIds,
                activityBookings: commaSeparatedActivityIds ?? '',
                notes: notes || "", 
            },
            ...(amount.detours > 0
                ? amount.alojamentoIdeal > 0 ? {
                    transfer_data: { destination: env.BOKUN_ENVIRONMENT == 'DEV' ? env.DETOURS_STRIPE_ID : env.DETOURS_STRIPE_ID_PROD, amount: amount.detours },
                } : {
                    transfer_data: { destination: env.BOKUN_ENVIRONMENT == 'DEV' ? env.DETOURS_STRIPE_ID : env.DETOURS_STRIPE_ID_PROD },
                }
                : {}),
            setup_future_usage: "off_session"
        });
        return { success: true, client_secret: paymentIntent.client_secret, id: paymentIntent.id };
    } catch (error) {
        console.log(error);
        return { success: false, client_secret: null, id: null };
    }
}
