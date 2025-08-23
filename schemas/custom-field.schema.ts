import z from "zod";

export const CustomFieldSchema = z.object({
    id: z.number(),
    name: z.string(),
    value: z.string(),
    type: z.union([z.literal("text"), z.literal("long_text"), z.literal("number"), z.literal("date"), z.literal("time"), z.literal("bool"), z.literal("option")]),
    options: z.array(z.string()).nullable()
});

export type CustomFieldType = z.infer<typeof CustomFieldSchema>;