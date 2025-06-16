import { z } from 'zod';

const ListingTranslationSchema = z.object({
    listing_id: z.number(),
    language: z.string(),
    name: z.string(),
    summary: z.string().nullable(),
    space: z.string().nullable(),
    interaction: z.string().nullable(),
    notes: z.string().nullable(),
    neighborhood_overview: z.string().nullable(),
    house_rules: z.string().nullable(),
    house_manual: z.string().nullable(),
    checkin_place: z.string().nullable(),
    arrival_info: z.string().nullable(),
    transit: z.string().nullable(),
    access: z.string().nullable()
});

export const TranslationResponseSchema = z.object({
    env: z.string().url(),
    success: z.boolean(),
    translation: z.array(ListingTranslationSchema)
});

export type ListingTranslation = z.infer<typeof ListingTranslationSchema>;

export type TranslationResponse = z.infer<typeof TranslationResponseSchema>;