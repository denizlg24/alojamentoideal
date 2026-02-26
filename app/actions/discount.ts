"use server";

import { stripe } from "@/lib/stripe";
import { verifySession } from "@/utils/verifySession";
import { UnauthorizedError } from "@/lib/utils";

export type DiscountPreview = {
  ok: true;
  code: string;
  couponId: string;
  promotionCodeId: string;
  percentOff: number | null;
  amountOffCents: number;
  currency: string;
  finalAmountCents: number;
};

export async function resolveDiscountCode(
  codeRaw: string,
  baseAmountCents: number,
): Promise<DiscountPreview | { ok: false; reason: string }> {
  if (!(await verifySession())) {
    throw new UnauthorizedError();
  }

  const code = String(codeRaw || "").trim();
  const base = Math.max(0, Math.floor(Number(baseAmountCents) || 0));

  if (!code) return { ok: false, reason: "missing_code" };
  if (!Number.isFinite(base) || base <= 0) return { ok: false, reason: "invalid_base" };

  const list = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 1,
    expand: ["data.coupon"],
  });

  const promo = list.data?.[0];
  if (!promo || !promo.active) return { ok: false, reason: "not_found" };

  const coupon = promo.coupon; // expanded
  const currency = String((coupon?.currency || "eur")).toLowerCase();
  const percentOff = typeof coupon?.percent_off === "number" ? coupon.percent_off : null;
  const amountOff = typeof coupon?.amount_off === "number" ? coupon.amount_off : null;

  let amountOffCents = 0;
  if (percentOff !== null && Number.isFinite(percentOff) && percentOff > 0) {
    amountOffCents = Math.round((base * percentOff) / 100);
  } else if (amountOff !== null && Number.isFinite(amountOff) && amountOff > 0) {
    amountOffCents = Math.round(amountOff);
  } else {
    return { ok: false, reason: "unsupported_coupon" };
  }

  amountOffCents = Math.max(0, Math.min(base, amountOffCents));
  const finalAmountCents = Math.max(0, base - amountOffCents);

  return {
    ok: true,
    code,
    couponId: String(coupon?.id || ""),
    promotionCodeId: String(promo.id || ""),
    percentOff,
    amountOffCents,
    currency,
    finalAmountCents,
  };
}

export async function previewDiscountOnAmount(code: string, baseAmountCents: number) {
  return resolveDiscountCode(code, baseAmountCents);
}
