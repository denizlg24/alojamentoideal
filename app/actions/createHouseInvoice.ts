"use server"

import { AccommodationItem } from "@/hooks/cart-context";
import { callHostkitAPI } from "./callHostkitApi";
import { Address } from "@stripe/stripe-js";
import { alpha2ToAlpha3 } from "i18n-iso-countries";

export async function createHouseInvoice({ item, clientName, clientAddress, clientTax, booking_code }: { item: AccommodationItem, clientName: string, clientAddress: Address, clientTax: string | undefined, booking_code: string }) {
    const fees = item.fees;

    const customer_id = clientTax == '' ? '999999990' : clientTax;
    const name = clientName;
    const country = clientAddress.country ? alpha2ToAlpha3(clientAddress.country) : undefined;
    const address = clientAddress.line1 + (clientAddress.line2 ? ` ${clientAddress.line2}` : "");
    const cp = clientAddress.postal_code || "";
    const city = clientAddress.city || "";
    const rcode = booking_code;
    const payment_method = 'TB'
    const newInvoiceQuery: Record<string, string> = {};



    const property = await callHostkitAPI<{ invoicing_nif: string, default_series: string }>({
        listingId: item.property_id.toString(), endpoint: "getProperty"
    });

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
                const price = fee.total || 0;
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
                await callHostkitAPI<{ status: 'success' | unknown, line?: string }>({
                    listingId: item.property_id.toString(), endpoint: "addInvoiceLine", query
                })
            }
            //CLOSE
            /*
            const closed = await callHostkitAPI<{ status: 'success' | unknown, invoice_url?: string }>({
                listingId: item.property_id.toString(), endpoint: "closeInvoice", query: { id: newInvoice.id }
            })*/
            const invoice = await callHostkitAPI<{ invoice_url: string }[]>({
                listingId: item.property_id.toString(), endpoint: "getInvoices", query: { id: newInvoice.id, customer_id: customer_id || "999999990" }
            })
            if (invoice && invoice.length > 0) {
                return invoice[0].invoice_url;
            }
        }

    }
    return ""
}