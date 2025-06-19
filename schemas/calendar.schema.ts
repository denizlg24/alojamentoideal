import { z } from "zod";

export const CalendarSchema = z.object({
    id: z.number(),
    reservation_id: z.number(),
    date: z.string(),
    status: z.enum(["available", "unavailable", "booked"]),
    currency: z.string().length(3),
    price: z.number(),
    note: z.string(),
});

export type CalendarType = z.infer<typeof CalendarSchema>;