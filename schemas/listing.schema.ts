import { z } from "zod";

export const UserSchema = z.object({
    id: z.number().int(),
    username: z.string().email(),
    first_name: z.string(),
    last_name: z.string(),
    phone: z.number().int(),
    roles: z.string(),
});

export const ListingSchema = z.object({
    id: z.number().int(),
    fs_integration_type: z.number().int(),
    currency: z.string(),
    channel_listing_id: z.number().int(),
    room_type: z.number().int(),
    listing_type: z.number().int(),
    property_type_id: z.number().int(),
    property_type: z.string(),
    instant_booking: z.string(),
    name: z.string(),
    updated_at: z.string(),
    nickname: z.string(),
    security_deposit: z.number().int(),
    cleaning_fee: z.number().nullable(),
    pets_fee: z.number().nullable(),
    extra_person: z.number(),
    guests_included: z.number().int(),
    default_daily_price: z.number(),
    weekend_price: z.number().nullable(),
    weekly_price_factor: z.number(),
    monthly_price_factor: z.number(),
    min_nights: z.number().int(),
    max_nights: z.number().int(),
    checkin_start: z.string(),
    checkin_end: z.string(),
    checkout: z.string(),
    cancel_policy: z.number().int(),
    max_notice_days: z.number().int(),
    min_notice_hours: z.number().int(),
    thumbnail_file: z.string().url(),
    is_listed: z.number().int(),
    country: z.string(),
    countrycode: z.string(),
    state: z.string(),
    city: z.string(),
    city_id: z.number().int(),
    zipcode: z.string(),
    street: z.string(),
    neighbourhood: z.string(),
    lat: z.number(),
    lng: z.number(),
    timezone_offset: z.any().nullable(),
    timezone: z.string(),
    price_markup: z.number().int(),
    master_calendar: z.number().int(),
    pricing_model: z.any().nullable(),
    person_capacity: z.number().int(),
    bathrooms: z.number(),
    bathroom_shared: z.number().int(),
    bedrooms: z.number().int(),
    beds: z.number().int(),
    area: z.number().nullable(),
    symbol: z.string(),
    unicode: z.string(),
    position: z.string(),
    service_pms: z.number().int(),
    integration_nickname: z.string(),
    integration_name: z.string(),
    integration_photo: z.string().url(),
    price: z.number(),
    price_monthly: z.number(),
    available_from: z.string(),
    tags: z.any().nullable(),
    custom_fields: z.array(z.any()),
    users: z.array(UserSchema),
    integration_id: z.number().int(),
    reviews: z.object({ rating: z.number(), reviews: z.number() })
});

export type ListingType = z.infer<typeof ListingSchema>;