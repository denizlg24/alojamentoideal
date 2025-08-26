"use server"

import { AccommodationItem } from "@/hooks/cart-context";
import { callHostkitAPI } from "./callHostkitApi";
import { Address } from "@stripe/stripe-js";
import { toAlpha3 } from "i18n-iso-countries";

export async function createHouseInvoice({ item, clientName, clientAddress, clientTax, booking_code }: { item: AccommodationItem, clientName: string, clientAddress: Address, clientTax: string | undefined, booking_code: string }) {
    const fees = item.fees;

    const customer_id = clientTax == '' ? '999999990' : clientTax;
    const name = clientName;
    const country = clientAddress.country ? toAlpha3(clientAddress.country) : undefined;
    const address = `${clientAddress.line1}${clientAddress.line2 ? ` ${clientAddress.line2}` : " "}`;
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
        if (address) newInvoiceQuery.address = address;
        if (cp) newInvoiceQuery.cp = cp;
        if (city) newInvoiceQuery.city = city;
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
                const fee_name = fee.fee_name;
                const fee_type = fee.fee_type;
                if (fee_type == 'accommodation') {
                    const custom_descr = fee_name || "Alojamento Local";
                    const product_id = 'AL';
                    const qty = 1;
                    const price = fee.total || 0;
                    const vat = fee.inclusive_percent ? fee.inclusive_percent * 100 : 0;
                    const query: Record<string, string | number> = {
                        id,
                        product_id,
                        custom_descr,
                        qty,
                        price,
                        discount: 0,
                        vat,
                        type: 'S',
                        reason_code: vat == 0 ? 'M99' : ''
                    };
                    await callHostkitAPI<{ status: 'success' | unknown, line?: string }>({
                        listingId: item.property_id.toString(), endpoint: "addInvoiceLine", query
                    })

                } else if (fee_type == 'fee') {
                    const custom_descr = fee_name || "EXTRA";
                    const product_id = 'EXTRAS';
                    const qty = fee.quantity || 1;
                    const price = fee.total || 0;
                    const vat = fee.inclusive_percent ? fee.inclusive_percent * 100 : 0;
                    const query: Record<string, string | number> = {
                        id,
                        product_id,
                        custom_descr,
                        qty,
                        price,
                        discount: 0,
                        vat,
                        reason_code: vat == 0 ? 'M99' : ''
                    };
                    await callHostkitAPI<{ status: 'success' | unknown, line?: string }>({
                        listingId: item.property_id.toString(), endpoint: "addInvoiceLine", query
                    })
                } else if (fee_type == 'tax') {
                    const custom_descr = fee_name || "City Tax";
                    const product_id = 'TMT';
                    const qty = 1;
                    const price = fee.total || 0;
                    const vat = fee.inclusive_percent ? fee.inclusive_percent * 100 : 0;
                    const query: Record<string, string | number> = {
                        id,
                        product_id,
                        custom_descr,
                        qty,
                        price,
                        discount: 0,
                        vat,
                        reason_code: vat == 0 ? 'M99' : ''
                    };
                    await callHostkitAPI<{ status: 'success' | unknown, line?: string }>({
                        listingId: item.property_id.toString(), endpoint: "addInvoiceLine", query
                    })
                }
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