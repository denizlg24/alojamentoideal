import { z } from "zod";

export const GuestSchema = z.object({
    id: z.number(),
    channel_guest_id: z.number(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    location: z.string(),
    is_verified: z.number().int().min(0).max(1),
    has_facebook: z.number().int().min(0).max(1),
    has_governmentid: z.number().int().min(0).max(1),
    has_email: z.number().int().min(0).max(1),
    has_phone: z.number().int().min(0).max(1),
    reviews: z.number(),
    about: z.string(),
    work: z.string(),
    languages: z.array(z.string()),
    original_file: z.string().url(),
    notes: z.string(),
    integration_id: z.number(),
});