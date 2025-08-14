"use server";

import { CartItem } from "@/hooks/cart-context";
import { PriceType } from "@/schemas/price.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { verifySession } from "@/utils/verifySession";
import { format } from "date-fns";

export const calculateAmount = async (cart: CartItem[]) => {
    if (!(await verifySession())) {
        throw new Error('Unauthorized');
    }
    let total = 0;
    for (const cartItem of cart) {
        if (cartItem.type == "accommodation") {
            const to = new Date(cartItem.end_date);
            const from = new Date(cartItem.start_date);
            const id = cartItem.property_id;
            const guests = { adults: cartItem.adults, children: cartItem.children, infants: cartItem.infants, pets: cartItem.pets };

            const price = await hostifyRequest<{ price: PriceType }>(
                `listings/price?listing_id=${id}&start_date=${format(
                    from,
                    "yyyy-MM-dd"
                )}&end_date=${format(to, "yyyy-MM-dd")}`,
                "GET",
                [
                    { key: "guests", value: guests.adults + guests.children },
                    { key: "include_fees", value: 1 },
                    { key: "pets", value: guests.pets },
                ],
                undefined,
                undefined,
                undefined
            );
            const nights = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
            let overchargeToDeduct = 0;
            price.price.fees = price.price.fees.map((fee) => {
                if (fee.fee_name.includes("City Tax")) {
                    const maxQuantity = guests.adults * nights;
                    if (fee.quantity > maxQuantity) {
                        const excess = fee.quantity - maxQuantity;
                        const unitAmount = fee.total / fee.quantity;
                        const excessAmount = unitAmount * excess;
                        overchargeToDeduct += excessAmount;

                        return {
                            ...fee,
                            quantity: maxQuantity,
                            total: unitAmount * maxQuantity,
                            total_net: (fee.total_net / fee.quantity) * maxQuantity,
                            total_tax: (fee.total_tax / fee.quantity) * maxQuantity,
                        };
                    }
                }
                return fee;
            });
            price.price.total -= overchargeToDeduct;
            total += price.price.total;
        }
    }
    return total * 100;
}