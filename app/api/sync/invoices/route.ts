import { attachInvoice } from '@/app/actions/attachInvoice';
import { createHouseInvoice } from '@/app/actions/createHouseInvoice';
import { getHtml } from '@/app/actions/getHtml';
import { sendMail } from '@/app/actions/sendMail';
import { CartItem } from '@/hooks/cart-context';
import { connectDB } from '@/lib/mongodb';
import { stripe } from '@/lib/stripe';
import OrderModel from '@/models/Order';
import { ReservationType } from '@/schemas/reservation.schema';
import env from '@/utils/env';
import { hostifyRequest } from '@/utils/hostify-request';
import { isBefore, isSameDay, parse } from 'date-fns';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(req: Request) {
    if (req.headers.get('Authorization') !== `Bearer ${env.CRON_SECRET}`) {
        return NextResponse.json("Unauthorized", { status: 401 });
    }
    await connectDB();
    try {
        const orders = await OrderModel.find().lean();
        for (const order of orders) {
            const reservation_ids = order.reservationIds;
            const accommodationItems = order.items.filter((item) => item.type == 'accommodation');
            const succeeded_reservation_ids: string[] = [];
            const succeeded_reservation_references: string[] = [];
            const succeeded_order_items: CartItem[] = [];
            if (reservation_ids.length == 0) continue;
            const paymentId = await stripe.paymentIntents.retrieve(order.payment_id);
            if(!paymentId) continue;
            const chargeID =paymentId.latest_charge as string;
            const charge = await stripe.charges.retrieve(chargeID);
            if(!charge) continue;
            for (let index = 0; index < reservation_ids.length; index++) {
                const id = reservation_ids[index];
                const reference = order.reservationReferences[index];
                const item = accommodationItems[index];
                if(item.invoice || item.invoice_id) continue;
                const reservationInfo = await hostifyRequest<{
                    reservation: ReservationType;
                }>(
                    `reservations/${id}`,
                    "GET",
                    undefined,
                    undefined,
                    undefined
                );
                if (!reservationInfo || !reservationInfo.reservation || reservationInfo.reservation.status != 'accepted') continue;
                const checkout = parse(reservationInfo.reservation.checkOut, "yyyy-MM-dd", new Date());
                if (!(isSameDay(checkout, new Date()) || isBefore(checkout,new Date()))) continue;
                succeeded_order_items.push(item);
                succeeded_reservation_ids.push(id);
                succeeded_reservation_references.push(reference);
            }
            if (succeeded_reservation_ids.length > 0)
                await issueInvoices({ reservationIds: succeeded_reservation_ids, reservationReferences: succeeded_reservation_references, items: succeeded_order_items, userInfo: { email: order.email, name: order.name, companyName: order.companyName, tax_number: order.tax_number, isCompany: order.isCompany }, charge, order_id: order.orderId })
        }
    } catch (error) {
        console.log(error);
    }
    return NextResponse.json({ ok: true });
}

const issueInvoices = async ({ reservationIds, reservationReferences, items, userInfo, charge, order_id }: {
    reservationIds: string[], reservationReferences: string[], items: CartItem[], userInfo: {
        isCompany?: boolean,
        email: string,
        companyName?: string,
        name: string,
        tax_number?: string
    }, charge: Stripe.Charge, order_id: string
}) => {
    const t = await getTranslations("order-email");
    for (let index = 0; index < reservationIds.length; index++) {
        const reservationCode = reservationReferences[index];
        const reservation_id = reservationIds[index];
        const orderItem = items.filter((item) => item.type == 'accommodation')[index];
        const order_index = items.findIndex((item) => item == orderItem);
        const itemInvoice = await createHouseInvoice({ reservationId: reservation_id, clientName: userInfo.isCompany ? (userInfo.companyName || userInfo.name) : userInfo.name, clientTax: userInfo.tax_number, booking_code: reservationCode, clientAddress: charge.billing_details.address ?? undefined })
        if (itemInvoice.url && itemInvoice.id) {
            const nights =
                (new Date(orderItem.end_date!).getTime() -
                    new Date(orderItem.start_date!).getTime()) /
                (1000 * 60 * 60 * 24);
            const productHtml = await getHtml('emails/order-product.html', [{ '{{product_name}}': orderItem.name }, {
                '{{product_description}}': t("nights", {
                    count:
                        nights,
                    adults: orderItem.adults!,
                    children:
                        orderItem.children! > 0 ? t("children_text", { count: orderItem.children! }) : "",
                    infants:
                        orderItem.infants! > 0 ? t("infants_text", { count: orderItem.infants! }) : "",
                })
            }, { '{{product_quantity}}': t("reservation", { number: reservationCode }) }, { "{{product_price}}": `${orderItem.front_end_price ?? 0}€` }, { "{{product_photo}}": orderItem.photo }])

            const orderHtml = await getHtml('emails/invoice-sent-email.html',
                [{ "{{products_html}}": productHtml },
                { "{{your-invoice-is-ready}}": t('your-invoice-is-ready') },
                { "{{view-your-invoice}}": t('view-your-invoice') },
                { "{{order-number}}": t('reservation-number', { order_id: reservationCode }) },
                { '{{invoice_url}}': itemInvoice.url }
                ])
            const success = await attachInvoice({ orderId: order_id, index: order_index, invoice_url: { url: itemInvoice.url, id: itemInvoice.id } })

            await sendMail({
                email: userInfo.email,
                html: orderHtml,
                subject: t('invoice-for-reservation', { order_id: reservationCode }),
            });
            return success;
        }
    }
    return true;
}