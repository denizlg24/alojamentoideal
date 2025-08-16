"use server";
import { CartItem } from "@/hooks/cart-context";
import { FeeType } from "@/schemas/price.schema";
import mongoose from "mongoose";

export interface OrderDocument extends Document {
    orderId: string;
    name: string;
    email: string;
    phoneNumber: string;
    notes?: string;
    reservationIds: string[];
    reservationReferences: string[];
    items: CartItem[];
    createdAt: Date;
    payment_id: string;
    transaction_id: string[];
}

const FeeSchema = new mongoose.Schema<FeeType>(
    {
        fee_id: Number,
        total: Number,
        fee_name: String,
    },
    { _id: false }
);

const ItemSchema = new mongoose.Schema<CartItem>(
    {
        type: {
            type: String,
            enum: ["product", "accommodation"],
            required: true,
        },
        id: { type: String },
        name: { type: String, required: true },
        price: { type: Number },
        quantity: { type: Number },
        photo: { type: String },
        description: { type: String },

        property_id: { type: Number },
        start_date: { type: String },
        end_date: { type: String },
        adults: { type: Number },
        children: { type: Number },
        infants: { type: Number },
        pets: { type: Number },
        front_end_price: { type: Number },
        fees: { type: [FeeSchema] },
    },
    { _id: false }
);

const OrderSchema = new mongoose.Schema<OrderDocument>(
    {
        orderId: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        notes: { type: String },
        reservationIds: [{ type: String }],
        reservationReferences: [{ type: String }],
        items: [ItemSchema],
        payment_id: { type: String },
        transaction_id: [{ type: String }]
    },
    { timestamps: true }
);

const OrderModel: mongoose.Model<OrderDocument> = mongoose.models.Order || mongoose.model<OrderDocument>("Order", OrderSchema);

export default OrderModel;