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
            let finalPrice = 0;
            price.price.fees = price.price.fees.map((fee) => {
                if (fee.fee_type == "tax") {
                    const maxQuantity = guests.adults * nights;
                    if (fee.quantity > maxQuantity) {
                        const unitAmount = fee.total_net / fee.quantity;
                        finalPrice += Number((unitAmount * maxQuantity * (1 + fee.inclusive_percent)).toFixed(2));
                        return {
                            ...fee,
                            quantity: maxQuantity,
                            total: Number((unitAmount * maxQuantity * (1 + fee.inclusive_percent)).toFixed(2)),
                            total_net: unitAmount * maxQuantity,
                            total_tax: unitAmount * maxQuantity * fee.inclusive_percent,
                        };
                    }
                }
                finalPrice += Number((fee.total_net * (1 + fee.inclusive_percent)).toFixed(2));
                return {
                    ...fee,
                    total: Number((fee.total_net * (1 + fee.inclusive_percent)).toFixed(2)),
                    total_tax: fee.total_net * fee.inclusive_percent,
                };
            });
            price.price.total = finalPrice;
            total += price.price.total;
        }
    }
    return total * 100;
}