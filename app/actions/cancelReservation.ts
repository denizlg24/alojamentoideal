"use server"

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import OrderModel from "@/models/Order";
import { hostifyRequest } from "@/utils/hostify-request";
import { verifySession } from "@/utils/verifySession";
import { createRefundHouseInvoice, issueCreditNote } from "./createHouseInvoice";
import { stripe } from "@/lib/stripe";
import { attachInvoice } from "./attachInvoice";
import { ReservationType } from "@/schemas/reservation.schema";
import { ReservationFee } from "@/utils/hostify-appartment-types";
import { getTranslations } from "next-intl/server";
import { getHtml } from "./getHtml";
import env from "@/utils/env";
import { sendMail } from "./sendMail";

export async function cancelReservation(reservation_id: string, transaction_id: string) {
    if (!(await verifySession())) {
        throw new Error("Unauthorized")
    }
    const session = await auth();
    if (!session) {
        throw new Error("Unauthorized")
    }
    await connectDB();
    await hostifyRequest<{ success: boolean }>(
        `reservations/${reservation_id}`,
        "PUT",
        undefined,
        {
            status: "cancelled_by_host",
        },
        undefined,
        undefined
    );

    await hostifyRequest<{ success: boolean }>(
        `transactions/${transaction_id}`,
        "PUT",
        undefined,
        {
            arrival_date: "",
            is_completed: 0,
            details: `Canceled reservation by: ${session.user?.id}`
        },
        undefined,
        undefined
    );

}

export async function clientCancelReservation(reservation_id: number, reservation_code: string, refund_amount: number, order_id: string) {
    if (!(await verifySession())) {
        throw new Error("Unauthorized")
    }
    try {
        await connectDB();
        const foundOrder = await OrderModel.findOne(({ orderId: order_id }));
        if (!foundOrder) {
            return false;
        }
        const t = await getTranslations("order-email")
        const item = foundOrder.items.filter((item) => item.type == 'accommodation')[foundOrder.reservationIds.indexOf(reservation_id.toString())]
        const nights =
            (new Date(item.end_date!).getTime() -
                new Date(item.start_date!).getTime()) /
            (1000 * 60 * 60 * 24);
        const productHtml = await getHtml('emails/order-product.html', [{ '{{product_name}}': item.name }, {
            '{{product_description}}': t("nights", {
                count:
                    nights,
                adults: item.adults!,
                children:
                    item.children! > 0 ? t("children_text", { count: item.children! }) : "",
                infants:
                    item.infants! > 0 ? t("infants_text", { count: item.infants! }) : "",
            })
        }, { '{{product_quantity}}': t("reservation", { number: reservation_code }) }, { "{{product_price}}": `${item.front_end_price ?? 0}€` }, { "{{product_photo}}": item.photo }])

        const orderHtml = await getHtml('emails/invoice-sent-email.html',
            [{ "{{products_html}}": productHtml },
            { "{{your-invoice-is-ready}}": t('your-activity-cancelled') },
            { "{{view-your-invoice}}": t('view-reservation') },
            { "{{order-number}}": t('reservation-number', { order_id: reservation_code }) },
            { '{{invoice_url}}': `${env.SITE_URL}/reservations/${reservation_id}`}
            ])

        await sendMail({
            email: foundOrder.email,
            html: orderHtml,
            subject: t('reservation-cancellation', { order_id: reservation_code }),
        });
        if (refund_amount == 0) {
            const success = await hostifyRequest<{ success: boolean }>(
                `reservations/${reservation_id}`,
                "PUT",
                undefined,
                {
                    status: "cancelled_by_guest",
                },
                undefined,
                undefined
            );
            //send email.
            return success.success;
        }
        if (refund_amount == 50) {
            const paymentIntent = await stripe.paymentIntents.retrieve(foundOrder.payment_id);
            const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
            if (item && item.invoice_id) {
                const newInvoice = await createRefundHouseInvoice({ reservationId: reservation_id, clientName: foundOrder.isCompany ? (foundOrder.companyName || foundOrder.name) : foundOrder.name, clientTax: foundOrder.tax_number, booking_code: reservation_code, clientAddress: charge.billing_details.address ?? undefined, refund_amount: 50 })
                const credit_note_sent = await issueCreditNote({ clientEmail: foundOrder.email, invoice_id: item.invoice_id, item, reservationCode: reservation_code });
                console.log(`Credit note sent: ${credit_note_sent}`);
                if (newInvoice.url && newInvoice.id) {
                    //send email
                    const attached = await attachInvoice({ orderId: foundOrder.orderId, invoice_url: newInvoice, index: foundOrder.items.indexOf(item) });
                    if (attached) {
                        console.log(attached);
                    }
                    const nights =
                        (new Date(item.end_date!).getTime() -
                            new Date(item.start_date!).getTime()) /
                        (1000 * 60 * 60 * 24);
                    const productHtml = await getHtml('emails/order-product.html', [{ '{{product_name}}': item.name }, {
                        '{{product_description}}': t("nights", {
                            count:
                                nights,
                            adults: item.adults!,
                            children:
                                item.children! > 0 ? t("children_text", { count: item.children! }) : "",
                            infants:
                                item.infants! > 0 ? t("infants_text", { count: item.infants! }) : "",
                        })
                    }, { '{{product_quantity}}': t("reservation", { number: reservation_code }) }, { "{{product_price}}": `${item.front_end_price ?? 0}€` }, { "{{product_photo}}": item.photo }])

                    const orderHtml = await getHtml('emails/invoice-sent-email.html',
                        [{ "{{products_html}}": productHtml },
                        { "{{your-invoice-is-ready}}": t('your-new-invoice-is-ready') },
                        { "{{view-your-invoice}}": t('view-your-invoice') },
                        { "{{order-number}}": t('reservation-number', { order_id: reservation_code }) },
                        { '{{invoice_url}}': newInvoice.url }
                        ])

                    await sendMail({
                        email: foundOrder.email,
                        html: orderHtml,
                        subject: t('invoice-for-reservation', { order_id: reservation_code }),
                    });
                }
            }
            const info = await hostifyRequest<{ reservation: ReservationType, fees: ReservationFee[] }>(
                `reservations/${reservation_id}?fees=1`,
                "GET",
                undefined,
                undefined,
                undefined
            );
            const fees = info.fees;

            const cancelled = await hostifyRequest<{ success: boolean }>(
                `reservations/${reservation_id}`,
                "PUT",
                undefined,
                {
                    status: "cancelled_by_guest",
                },
                undefined,
                undefined
            );

            if (!cancelled.success) {
                const hostCancel = await hostifyRequest<{ success: boolean }>(
                    `reservations/${reservation_id}`,
                    "PUT",
                    undefined,
                    {
                        status: "cancelled_by_host",
                    },
                    undefined,
                    undefined
                );
                console.log(hostCancel);
            }

            let finalRefundPrice = 0;
            const refundTaxPercentages: Record<number, number> = {};
            const nights = ((new Date(info.reservation.checkIn)).getTime() - (new Date(info.reservation.checkOut)).getTime()) / (1000 * 60 * 60 * 24);
            const final_refund_fees = fees.map((fee) => {
                const inclusive_percent = fee.amount_tax_total ? Number((fee.amount_tax_total / fee.amount_net_total).toFixed(2)) : 0;
                if (fee.fee.type == 'accommodation') {
                    refundTaxPercentages[inclusive_percent] =
                        (refundTaxPercentages[inclusive_percent] ?? 0) + (fee.amount_net_total / 2);
                    return {
                        ...fee,
                        total: Number(((fee.amount_net_total / 2) * (1 + inclusive_percent)).toFixed(2)),
                        total_tax: (fee.amount_net_total * 2) * inclusive_percent,
                    };
                }
                if (fee.fee.type == "tax") {
                    const maxQuantity = info.reservation.adults * nights;
                    if (fee.quantity > maxQuantity) {
                        const unitAmount = fee.amount_net_total / fee.quantity;
                        refundTaxPercentages[inclusive_percent] =
                            (refundTaxPercentages[inclusive_percent] ?? 0) +
                            unitAmount * maxQuantity;
                        return {
                            ...fee,
                            quantity: maxQuantity,
                            total: Number(
                                (unitAmount * maxQuantity * (1 + inclusive_percent)).toFixed(
                                    2
                                )
                            ),
                            total_net: unitAmount * maxQuantity,
                            total_tax: unitAmount * maxQuantity * inclusive_percent,
                        };
                    }
                }
                refundTaxPercentages[inclusive_percent] =
                    (refundTaxPercentages[inclusive_percent] ?? 0) + fee.amount_net_total;
                return {
                    ...fee,
                    total: Number((fee.amount_net_total * (1 + inclusive_percent)).toFixed(2)),
                    total_tax: fee.amount_net_total * inclusive_percent,
                };
            });
            console.log(final_refund_fees);
            for (const percentage of Object.keys(refundTaxPercentages)) {
                finalRefundPrice +=
                    refundTaxPercentages[Number(percentage)] * (1 + Number(percentage));
            }

            let finalPrice = 0;
            const taxPercentages: Record<number, number> = {};
            const final_fees = fees.map((fee) => {
                const inclusive_percent = fee.amount_tax_total ? Number((fee.amount_tax_total / fee.amount_net_total).toFixed(2)) : 0;
                if (fee.fee.type == "tax") {
                    const maxQuantity = info.reservation.adults * nights;
                    if (fee.quantity > maxQuantity) {
                        const unitAmount = fee.amount_net_total / fee.quantity;
                        taxPercentages[inclusive_percent] =
                            (taxPercentages[inclusive_percent] ?? 0) +
                            unitAmount * maxQuantity;
                        return {
                            ...fee,
                            quantity: maxQuantity,
                            total: Number(
                                (unitAmount * maxQuantity * (1 + inclusive_percent)).toFixed(
                                    2
                                )
                            ),
                            total_net: unitAmount * maxQuantity,
                            total_tax: unitAmount * maxQuantity * inclusive_percent,
                        };
                    }
                }
                taxPercentages[inclusive_percent] =
                    (taxPercentages[inclusive_percent] ?? 0) + fee.amount_net_total;
                return {
                    ...fee,
                    total: Number((fee.amount_net_total * (1 + inclusive_percent)).toFixed(2)),
                    total_tax: fee.amount_net_total * inclusive_percent,
                };
            });
            console.log(final_fees);
            for (const percentage of Object.keys(taxPercentages)) {
                finalPrice +=
                    taxPercentages[Number(percentage)] * (1 + Number(percentage));
            }
            const difference = Number(finalPrice.toFixed(2)) - Number(finalRefundPrice.toFixed(2));
            console.log(difference);
            const differenceCents = difference * 100;
            const refund = await stripe.refunds.create({
                charge: charge.id,
                amount: differenceCents,
            });
            if (refund) {
                const email = foundOrder.email;
                const t = await getTranslations("order-email")
                const refundHtml = await getHtml('emails/invoice-sent-email.html',
                    [{ "{{products_html}}": t("success-refund", { amount: refund.amount / 100 }) },
                    { "{{your-invoice-is-ready}}": t('activity-cancellation') },
                    { "{{view-your-invoice}}": t('view-activity-page') },
                    { "{{order-number}}": t('order-number', { order_id: foundOrder.orderId }) },
                    { '{{invoice_url}}': `${env.SITE_URL}/reservations/${reservation_id}` }
                    ])
                await sendMail({ email, html: refundHtml, subject: t("activity-refund-id", { id: reservation_code }) })
            }
            return true;
        }
        if (refund_amount == 100) {
            const paymentIntent = await stripe.paymentIntents.retrieve(foundOrder.payment_id);
            const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
            if (item && item.invoice_id) {
                await issueCreditNote({ clientEmail: foundOrder.email, invoice_id: item.invoice_id, item, reservationCode: reservation_code });
            }
            await hostifyRequest<{ success: boolean }>(
                `reservations/${reservation_id}`,
                "PUT",
                undefined,
                {
                    status: "cancelled_by_guest",
                },
                undefined,
                undefined
            );

            const transaction = await hostifyRequest<{ success: boolean, transaction: { amount: number } }>(
                `transactions/${foundOrder.transaction_id[foundOrder.reservationIds.indexOf(reservation_id.toString())]}`,
                "GET",
            );

            const refund = await stripe.refunds.create({
                charge: charge.id,
                amount: transaction.transaction.amount * 100
            });

            if (refund) {
                const email = foundOrder.email;
                const t = await getTranslations("order-email")
                const refundHtml = await getHtml('emails/invoice-sent-email.html',
                    [{ "{{products_html}}": t("success-refund", { amount: refund.amount / 100 }) },
                    { "{{your-invoice-is-ready}}": t('activity-cancellation') },
                    { "{{view-your-invoice}}": t('view-activity-page') },
                    { "{{order-number}}": t('order-number', { order_id: foundOrder.orderId }) },
                    { '{{invoice_url}}': `${env.SITE_URL}/reservations/${reservation_id}` }
                    ])
                await sendMail({ email, html: refundHtml, subject: t("activity-refund-id", { id: reservation_code }) })
            }
            return true;
        }
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }


}