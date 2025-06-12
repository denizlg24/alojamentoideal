import { z } from "zod";

export const CalendarSchema = z.object({
    id: z.number(),
    reservation_id: z.number(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(["available", "unavailable", "booked"]),
    currency: z.string().length(3),
    price: z.number(),
    note: z.string(),
});