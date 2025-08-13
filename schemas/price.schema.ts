import { z } from "zod";

export const FeeSchema = z.object({
    property_fee_id: z.number(),
    fee_id: z.number(),
    fee_name: z.string(),
    fee_type: z.string(),
    valid_from: z.number(),
    valid_to: z.number().nullable(),
    condition_type: z.string(),
    valid_whole_stay: z.number(),
    cap_length: z.number().nullable(),
    cap_type: z.string().nullable(),
    fee_charge_type: z.string(),
    charge_type_label: z.string(),
    is_base_price: z.boolean(),
    quantity: z.number(),
    exclusive_percent: z.number(),
    inclusive_percent: z.number(),
    exclusive_tax: z.number(),
    inclusive_tax: z.number(),
    amount: z.number(),
    total_tax: z.number(),
    total_net: z.number(),
    total: z.number()
});

export const PriceSchema = z.object({
    channel_listing_id: z.number(),
    is_listed: z.number(),
    nights: z.number(),
    price: z.number(),
    security_deposit: z.number(),
    guests_included: z.number(),
    person_capacity: z.number(),
    iso_code: z.string(),
    symbol: z.string(),
    unicode: z.string(),
    position: z.string(),
    available: z.boolean(),
    extra_person_price_per_night: z.number(),
    base_price: z.number(),
    base_price_per_night: z.number(),
    security_price: z.number().nullable(),
    total: z.number(),
    fees: z.array(FeeSchema)
});

export type PriceType = z.infer<typeof PriceSchema>;

export type FeeType = z.infer<typeof FeeSchema>;