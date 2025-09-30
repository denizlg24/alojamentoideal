"use server";
import { CartItem } from "@/hooks/cart-context";
import { connectDB } from "@/lib/mongodb";
import { generateReservationID } from "@/lib/utils";
import OrderModel from "@/models/Order";
import { verifySession } from "@/utils/verifySession";
import { getHtml } from "./getHtml";
import { getTranslations } from "next-intl/server";
import { format } from "date-fns";
import env from "@/utils/env";
import { sendMail } from "./sendMail";
import { getAdminEmails } from "@/utils/getAdminEmail";



type RegisterOrderInput = {
    name: string;
    email: string;
    phoneNumber: string;
    notes?: string;
    reservationIds: string[];
    reservationReferences: string[];
    items: CartItem[];
    payment_id: string;
    transaction_id: string[];
    payment_method_id: string;
    tax_number?: string;
    isCompany: boolean;
    companyName?: string;
    activityBookingIds?: string[],
    activityBookingReferences?: string[],
    orderId?: string
};

export async function registerOrder(data: RegisterOrderInput) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
    }
    try {
        await connectDB();

        const plainItems = data.items.map((item) => {
            if (item.type === "product") {
                return {
                    type: "product",
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    photo: item.photo,
                    description: item.description,
                    invoice: item.invoice
                };
            } else if (item.type == "activity") {
                return {
                    id: item.id,
                    type: "activity",
                    name: item.name,
                    price: item.price,
                    selectedDate: item.selectedDate,
                    selectedRateId: item.selectedRateId,
                    selectedStartTimeId: item.selectedStartTimeId,
                    guests: item.guests,
                    photo: item.photo,
                    invoice: item.invoice
                }
            } else {
                return {
                    type: "accommodation",
                    property_id: item.property_id,
                    name: item.name,
                    start_date: item.start_date,
                    end_date: item.end_date,
                    adults: item.adults,
                    children: item.children,
                    infants: item.infants,
                    pets: item.pets,
                    front_end_price: item.front_end_price,
                    photo: item.photo,
                    fees: item.fees,
                    invoice: item.invoice
                };
            }
        });

        const randomOrderId = generateReservationID();

        const order = new OrderModel({
            orderId: data.orderId ? data.orderId : randomOrderId,
            name: data.name,
            email: data.email,
            phoneNumber: data.phoneNumber,
            notes: data.notes,
            reservationIds: data.reservationIds,
            reservationReferences: data.reservationReferences,
            activityBookingIds: data.activityBookingIds ?? [],
            activityBookingReferences: data.activityBookingReferences ?? [],
            items: plainItems,
            payment_id: data.payment_id,
            transaction_id: data.transaction_id,
            payment_method_id: data.payment_method_id,
            tax_number: data.tax_number,
            isCompany: data.isCompany,
            companyName: data.companyName
        });

        await order.save();
        const t = await getTranslations("order-email");
        let products_html = ""
        let a = 0, b = 0;
        for (const i of plainItems) {
            if (i.type == "accommodation") {
                const nights =
                    (new Date(i.end_date!).getTime() -
                        new Date(i.start_date!).getTime()) /
                    (1000 * 60 * 60 * 24);
                const productHtml = await getHtml('emails/order-product.html', [{ '{{product_name}}': i.name }, {
                    '{{product_description}}': t("nights", {
                        count:
                            nights,
                        adults: i.adults!,
                        children:
                            i.children! > 0 ? t("children_text", { count: i.children! }) : "",
                        infants:
                            i.infants! > 0 ? t("infants_text", { count: i.infants! }) : "",
                    })
                }, { '{{product_quantity}}': t("reservation", { number: data.reservationReferences[a] }) }, { "{{product_price}}": `${i.front_end_price ?? 0}€` }, { "{{product_photo}}": i.photo }])
                products_html += productHtml;
                a++;
            }
            if (i.type == 'activity') {
                const productHtml = await getHtml('emails/order-product.html', [{ '{{product_name}}': i.name }, {
                    '{{product_description}}': t("tour-date", {
                        startDate: format(i.selectedDate!, "MMMM dd, yyyy")
                    })
                }, { '{{product_quantity}}': t("reservation", { number: data.activityBookingIds![b] }) }, { "{{product_price}}": `${i.price ?? 0}€` }, { "{{product_photo}}": i.photo }])
                products_html += productHtml;
                b++;
            }

        }
        const adminOrderHtml = await getHtml('emails/order-confirmed-email.html',
            [{ "{{products_html}}": products_html },
            { "{{your-order-is-in}}": t('admin-new-order') },
            { "{{view-your-order}}": t('view-order') },
            { "{{order-title}}": t('order-items') },
            { "{{order-number}}": t('order-number', { order_id: order.orderId }) },
            { "{{order-total}}": 'Total:' },
            {
                "{{total_price}}": `${plainItems.reduce((prev, curr) => {
                    if (curr.price && curr.quantity) {
                        return prev + curr.price * curr.quantity;
                    }
                    if (curr.price) {
                        return prev + curr.price;
                    }
                    return prev + curr.front_end_price!;
                }, 0)}€`
            },
            { '{{order_url}}': `${env.SITE_URL}/admin/dashboard/orders/${order.orderId}` }
            ])
            const adminEmail = await getAdminEmails();
            for(const mail of adminEmail){
                await sendMail({
                    email: mail,
                    html: adminOrderHtml,
                    subject: t('order-admin-number', { order_id: order.orderId }),
                });
            }
           
        return { success: true, orderId: order.orderId };
    } catch (error) {
        console.error('Failed to register order:', error);
        return { success: false, error: 'Failed to register order' };
    }
}