import z from "zod";

const FeeSchema = z.object({
    fee_id: z.number(),
    fee_name: z.string(),
    total: z.number(),
});

const ECommerceItemSchema = z.object({
    type: z.literal("product"),
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    photo: z.string(),
    description: z.string().optional(),
});

const AccommodationItemSchema = z.object({
    type: z.literal("accommodation"),
    property_id: z.number(),
    name: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    adults: z.number(),
    children: z.number(),
    infants: z.number(),
    pets: z.number(),
    front_end_price: z.number(),
    photo: z.string(),
    fees: z.array(FeeSchema),
});

const CartItemSchema = z.union([ECommerceItemSchema, AccommodationItemSchema]);

export const OrderSchemaZ = z.object({
    _id: z.string().optional(),
    orderId: z.string(),
    name: z.string(),
    email: z.string(),
    phoneNumber: z.string(),
    notes: z.string().optional(),
    reservationIds: z.array(z.string()),
    items: z.array(CartItemSchema),
    createdAt: z.string(),
});

export type OrderType = z.infer<typeof OrderSchemaZ>;