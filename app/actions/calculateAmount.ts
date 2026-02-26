"use server";

import { CartItem } from "@/hooks/cart-context";
import { UnauthorizedError } from "@/lib/utils";
import { FeeType, PriceType } from "@/schemas/price.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { verifySession } from "@/utils/verifySession";
import { format } from "date-fns";
import { resolveDiscountCode } from "@/app/actions/discount";

export const calculateBaseCents = async (cartItem: CartItem) => {
  if (!(await verifySession())) {
    throw new UnauthorizedError();
  }
  let baseTotalCents = 0;
  if (cartItem.type == "accommodation") {
    const to = new Date(cartItem.end_date);
    const from = new Date(cartItem.start_date);
    const id = cartItem.property_id;
    const guests = {
      adults: cartItem.adults,
      children: cartItem.children,
      infants: cartItem.infants,
      pets: cartItem.pets,
    };

    const price = await hostifyRequest<{ price: PriceType }>(
      `listings/price?listing_id=${id}&start_date=${format(
        from,
        "yyyy-MM-dd",
      )}&end_date=${format(to, "yyyy-MM-dd")}`,
      "GET",
      [
        { key: "guests", value: guests.adults + guests.children },
        { key: "include_fees", value: 1 },
        { key: "pets", value: guests.pets },
      ],
      undefined,
      undefined,
      undefined,
    );
    price.price.fees.forEach((fee) => {
      if (fee.fee_type == "accommodation") {
        baseTotalCents += fee.total_net * 100;
      }
    });
  }
  return baseTotalCents;
};

export const calculateAmount = async (
  cart: CartItem[],
  discountCode?: string,
) => {
  if (!(await verifySession())) {
    throw new UnauthorizedError();
  }
  let total = 0;
  const fees: FeeType[][] = [];
  let baseTotalCents = 0;
  let discount = null;
  const code = String(discountCode || "").trim();

  for (const cartItem of cart) {
    if (cartItem.type == "accommodation") {
      const to = new Date(cartItem.end_date);
      const from = new Date(cartItem.start_date);
      const id = cartItem.property_id;
      const guests = {
        adults: cartItem.adults,
        children: cartItem.children,
        infants: cartItem.infants,
        pets: cartItem.pets,
      };

      const price = await hostifyRequest<{ price: PriceType }>(
        `listings/price?listing_id=${id}&start_date=${format(
          from,
          "yyyy-MM-dd",
        )}&end_date=${format(to, "yyyy-MM-dd")}`,
        "GET",
        [
          { key: "guests", value: guests.adults + guests.children },
          { key: "include_fees", value: 1 },
          { key: "pets", value: guests.pets },
        ],
        undefined,
        undefined,
        undefined,
      );
      const nights = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      let finalPrice = 0;
      const taxPercentages: Record<number, number> = {};

      price.price.fees = price.price.fees.map((fee) => {
        if (fee.fee_type == "accommodation") {
          baseTotalCents += fee.total_net * 100;
        }
        if (fee.fee_type == "tax") {
          const maxQuantity = guests.adults * nights;
          if (fee.quantity > maxQuantity) {
            const unitAmount = fee.total_net / fee.quantity;
            taxPercentages[fee.inclusive_percent] =
              (taxPercentages[fee.inclusive_percent] ?? 0) +
              unitAmount * maxQuantity;
            return {
              ...fee,
              quantity: maxQuantity,
              total: Number(
                (
                  unitAmount *
                  maxQuantity *
                  (1 + fee.inclusive_percent)
                ).toFixed(2),
              ),
              total_net: unitAmount * maxQuantity,
              total_tax: unitAmount * maxQuantity * fee.inclusive_percent,
            };
          }
        }
        taxPercentages[fee.inclusive_percent] =
          (taxPercentages[fee.inclusive_percent] ?? 0) + fee.total_net;
        return {
          ...fee,
          total: Number(
            (fee.total_net * (1 + fee.inclusive_percent)).toFixed(2),
          ),
          total_tax: fee.total_net * fee.inclusive_percent,
        };
      });
      fees.push(price.price.fees);
      for (const percentage of Object.keys(taxPercentages)) {
        finalPrice +=
          taxPercentages[Number(percentage)] * (1 + Number(percentage));
      }
      price.price.total = Number(finalPrice.toFixed(2));
      total += price.price.total;
    }
  }

  if (code) {
    try {
      const r = await resolveDiscountCode(code, baseTotalCents);
      if (r?.ok) discount = r;
    } catch (err) {
      discount = null;
    }
  }

  fees.forEach((feeGroup) => {
    feeGroup.forEach((fee) => {
      if (fee.fee_type == "accommodation") {
        if (discount) {
          console.log(`Applying discount ${discount.code} to fee ${fee.fee_name}: -${(discount.amountOffCents ?? 0)/100}€`);
          fee.total_net *= 1 - ((discount.percentOff ?? 0)/100) 
          fee.total_tax = fee.total_net * fee.inclusive_percent;
          fee.total = fee.total_net * (1 + fee.inclusive_percent);
        }
      }
    });
  });

  console.log(fees);


  const finalTotalCents = fees.reduce((groupAcc, feeGroup) => {
    const groupTotal = feeGroup.reduce((feeAcc, fee) => {
      return feeAcc + fee.total;
    }, 0);
    return groupAcc + groupTotal;
  }, 0);

  return { total: Math.round(finalTotalCents*100), fees, discount };
};
