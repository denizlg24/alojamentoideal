"use server";
import { CartItem } from "@/hooks/cart-context";
import { connectDB } from "@/lib/mongodb";
import { generateReservationID } from "@/lib/utils";
import OrderModel from "@/models/Order";
import { verifySession } from "@/utils/verifySession";
import { getTranslations } from "next-intl/server";
import { getHtml } from "./getHtml";
import { sendMail } from "./sendMail";


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
};

export async function registerOrder(data: RegisterOrderInput) {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
    }
    try {
        const t = await getTranslations("order-email");
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
                };
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
                };
            }
        });

        const randomOrderId = generateReservationID();

        const order = new OrderModel({
            orderId: randomOrderId,
            name: data.name,
            email: data.email,
            phoneNumber: data.phoneNumber,
            notes: data.notes,
            reservationIds: data.reservationIds,
            reservationReferences: data.reservationReferences,
            items: plainItems,
            payment_id: data.payment_id,
            transaction_id: data.transaction_id
        });

        await order.save();

        const total = plainItems.reduce((prev, i) => {
            return i.type == "accommodation" ? prev + (i.front_end_price ?? 0) : prev + ((i.price ?? 0) * (i.quantity ?? 0))
        }, 0)
        let products_html = ""
        let a = 0;
        for (const i of plainItems) {
            if (i.type == "accommodation") {
                const nights =
                    (new Date(i.end_date!).getTime() -
                        new Date(i.start_date!).getTime()) /
                    (1000 * 60 * 60 * 24);
                const productHtml = await getHtml('/lib/emails/order-product.html', [{ '{{product_name}}': i.name }, {
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

        }
        const orderHtml = await getHtml('/lib/emails/order-confirmed-email.html',
            [{ "{{products_html}}": products_html },
            { "{{your-order-is-in}}": t('your-order-is-in') },
            { "{{view-your-order}}": t('view-your-order') },
            { "{{order-title}}": t('order-title') },
            { "{{order-number}}": t('order-number', { order_id: randomOrderId }) },
            { "{{order-total}}": 'Total:' },
            { "{{total_price}}": `${total}€` },
            { '{{order_url}}': `https://alojamentoideal.pt/orders/${randomOrderId}` }
            ])

        await sendMail({
            email: data.email,
            html: orderHtml,
            subject: t('order-number', { order_id: randomOrderId }),
        });
        return { success: true, orderId: order.orderId };
    } catch (error) {
        console.error('Failed to register order:', error);
        return { success: false, error: 'Failed to register order' };
    }
}