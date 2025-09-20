"use server"

import { AccommodationItem } from "@/hooks/cart-context";
import { callHostkitAPI } from "./callHostkitApi";
import { Address } from "@stripe/stripe-js";
import { alpha2ToAlpha3 } from "i18n-iso-countries";
import { getHtml } from "./getHtml";
import { getTranslations } from "next-intl/server";
import { sendMail } from "./sendMail";

export async function createHouseInvoice({ item, clientName, clientAddress, clientTax, booking_code }: { item: AccommodationItem, clientName: string, clientAddress?: Address, clientTax: string | undefined, booking_code: string }) {
    const fees = item.fees;

    const customer_id = clientTax == '' ? '999999990' : clientTax;
    const name = clientName;
    const country = clientAddress?.country ? alpha2ToAlpha3(clientAddress.country) : undefined;
    const address = clientAddress?.line1 + (clientAddress?.line2 ? ` ${clientAddress.line2}` : "");
    const cp = clientAddress?.postal_code || "";
    const city = clientAddress?.city || "";
    const rcode = booking_code;
    const payment_method = 'TB'
    const newInvoiceQuery: Record<string, string> = {};

    const property = await callHostkitAPI<{ invoicing_nif: string, default_series: string }>({
        listingId: item.property_id.toString(), endpoint: "getProperty"
    });

    console.log(property);

    if (property.invoicing_nif && property.default_series) {
        const invoicing_nif = property.invoicing_nif;
        const series = property.default_series;

        if (customer_id) newInvoiceQuery.customer_id = customer_id;
        if (name) newInvoiceQuery.name = name;
        if (country) newInvoiceQuery.country = country;
        if (address) newInvoiceQuery.address = encodeURI(address);
        if (cp) newInvoiceQuery.cp = cp;
        if (city) newInvoiceQuery.city = encodeURI(city);
        if (rcode) newInvoiceQuery.rcode = rcode;
        if (payment_method) newInvoiceQuery.payment_method = payment_method;
        if (invoicing_nif) newInvoiceQuery.invoicing_nif = invoicing_nif;
        if (series) newInvoiceQuery.series = series;

        const newInvoice = await callHostkitAPI<{ status: 'success' | unknown, id?: string }>({
            listingId: item.property_id.toString(), endpoint: "addInvoice", query: newInvoiceQuery
        })

        console.log(newInvoice);

        if (newInvoice.id) {
            const id = newInvoice.id;
            for (const fee of fees) {
                const custom_descr = fee.fee_name || ""
                let product_id = '';
                let type = '';
                switch (fee.fee_type?.toLowerCase()) {
                    case "accommodation":
                        product_id = 'AL';
                        type = 'S';
                        break;
                    case "tax":
                        product_id = "TMT";
                        type = 'I';
                        break;
                    default:
                        switch (fee.fee_name?.toLowerCase()) {
                            case "breakfast":
                                type = 'P';
                                product_id = "PA";
                                break;
                            case "cleaning fee t0-t1":
                            case "cleaning fee":
                            case "short-term cleaning fee":
                                type = 'S';
                                product_id = "CF";
                                break;
                            case "touristic tax":
                                type = 'I';
                                product_id = "TMT";
                                break;
                            case "management fee":
                            case "administrative fee":
                            case "guest registration":
                            case "hoa fee":
                            case "booking fee":
                                type = 'S';
                                product_id = "SAL";
                                break;
                            case "electricity fee":
                            case "gas fee":
                            case "oil fee":
                            case "wood fee":
                            case "water usage fee":
                            case "heating fee":
                            case "air conditioning fee":
                            case "utility fee":
                                type = 'S'
                                product_id = "Man";
                                break;
                            default:
                                type = 'S'
                                product_id = "EXTRAS";
                                break;
                        }
                        break;
                }
                const price = fee.total_net || 0;
                const vat = fee.inclusive_percent ? fee.inclusive_percent * 100 : 0;
                const qty = 1;
                const query: Record<string, string | number> = {
                    id,
                    product_id,
                    custom_descr,
                    qty,
                    price,
                    discount: 0,
                    vat,
                    type,
                    reason_code: vat == 0 ? 'M99' : ''
                };
                console.log(query);
                const response = await callHostkitAPI<{ status: 'success' | unknown, line?: string }>({
                    listingId: item.property_id.toString(), endpoint: "addInvoiceLine", query
                })
                console.log(response);
            }
            const closed = await callHostkitAPI<{ status: 'success' | unknown, invoice_url?: string }>({
                listingId: item.property_id.toString(), endpoint: "closeInvoice", query: { id: newInvoice.id }
            })
            /*
            const invoice = await callHostkitAPI<{ invoice_url: string }[]>({
                listingId: item.property_id.toString(), endpoint: "getReservationInvoices", query: { rcode: booking_code, invoicing_nif }
            })*/
            console.log(closed);
            if (closed && closed.invoice_url) {
                return { url: closed.invoice_url, id: newInvoice.id };
            }
        }

    }
    return { url: '', id: '' }
}

export async function issueCreditNote({ clientEmail, invoice_id, item, reservationCode }: { clientEmail: string, invoice_id: string, item: AccommodationItem, reservationCode: string }) {
    const invoice = await callHostkitAPI<{ invoice_url: string, series: string, }[]>({
        listingId: item.property_id.toString(), endpoint: "getReservationInvoices", query: { rcode:reservationCode }
    })
    console.log(invoice);
    const creditNote = await callHostkitAPI<{ status: 'success' | unknown, id?: string }>({
        listingId: item.property_id.toString(), endpoint: "addCreditNote", query: { refid: invoice_id, refseries: invoice[0].series }
    })
    console.log(creditNote);
    if (creditNote.status == 'success' && creditNote.id) {
        const finalCreditNote = await callHostkitAPI<{ credit_note_url?: string,refid:string }[]>({
            listingId: item.property_id.toString(), endpoint: "getCreditNotes", query: { series: invoice[0].series}
        })
        console.log(finalCreditNote);
        if ((finalCreditNote?.length ?? 0) > 0) {
            const t = await getTranslations("order-email");
            const note = finalCreditNote.find((no) => no.refid == invoice_id)?.credit_note_url;
            if (note) {
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
                }, { '{{product_quantity}}': t("reservation", { number: reservationCode }) }, { "{{product_price}}": `${item.front_end_price ?? 0}€` }, { "{{product_photo}}": item.photo }])
                const orderHtml = await getHtml('emails/invoice-sent-email.html',
                    [{ "{{products_html}}": productHtml },
                    { "{{your-invoice-is-ready}}": t('your-note-is-ready') },
                    { "{{view-your-invoice}}": t('view-your-note') },
                    { "{{order-number}}": t('reservation-number', { order_id: reservationCode }) },
                    { '{{invoice_url}}': note }
                    ])

                await sendMail({
                    email: clientEmail,
                    html: orderHtml,
                    subject: t('note-for-order', { order_id: reservationCode }),
                });
                return true;
            }
            return true;
        }
        return true;
    }
    return false;
}