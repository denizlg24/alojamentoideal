import { z } from "zod";

export const ReviewSchema = z.object({
    id: z.number().int(),
    reservation_id: z.number().int(),
    listing_id: z.number().int(),
    parent_listing_id: z.number().int(),
    guest_id: z.number().int(),
    integration_id: z.number().int(),
    created: z.string(),
    rating: z.number().int().min(1).max(5),
    accuracy_rating: z.number().int().min(1).max(5),
    checkin_rating: z.number().int().min(1).max(5),
    clean_rating: z.number().int().min(1).max(5),
    communication_rating: z.number().int().min(1).max(5),
    location_rating: z.number().int().min(1).max(5),
    value_rating: z.number().int().min(1).max(5),
    comments: z.string(),
    accuracy_comments: z.string(),
    checkin_comments: z.string(),
    clean_comments: z.string(),
    communication_comments: z.string(),
    improve_comments: z.string(),
    location_comments: z.string(),
    value_comments: z.string(),
});

export type ReviewType = z.infer<typeof ReviewSchema>;