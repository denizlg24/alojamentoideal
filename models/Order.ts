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
    payment_method_id: string;
    tax_number?: string;
    isCompany: boolean;
    companyName?: string;
    activityBookingIds?:string[];
    activityBookingReferences?:string[];
}

export interface IOrder {
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
    payment_method_id: string;
    tax_number?: string;
    isCompany: boolean;
    companyName?: string;
    activityBookingIds?:string[];
    activityBookingReferences?:string[];
}

const FeeSchema = new mongoose.Schema<FeeType>(
    {
        property_fee_id: Number,
        fee_id: Number,
        fee_name: String,
        fee_type: String,
        valid_from: Number,
        valid_to: Number,
        condition_type: String,
        valid_whole_stay: Number,
        cap_length: Number,
        cap_type: String,
        fee_charge_type: String,
        charge_type_label: String,
        is_base_price: Boolean,
        quantity: Number,
        exclusive_percent: Number,
        inclusive_percent: Number,
        exclusive_tax: Number,
        inclusive_tax: Number,
        amount: Number,
        total_tax: Number,
        total_net: Number,
        total: Number
    },
    { _id: false }
);

const ItemSchema = new mongoose.Schema<CartItem>(
    {
        type: {
            type: String,
            enum: ["product", "accommodation", "activity"],
            required: true,
        },
        id: { type: String },
        name: { type: String, required: true },
        price: { type: Number },
        quantity: { type: Number },
        photo: { type: String },
        description: { type: String },
        property_id: { type: Number },
        invoice: { type: String, default: "" },
        invoice_id:{ type: String, default: "" },
        start_date: { type: String },
        end_date: { type: String },
        adults: { type: Number },
        children: { type: Number },
        infants: { type: Number },
        pets: { type: Number },
        front_end_price: { type: Number },
        fees: { type: [FeeSchema] },
        guests: {
            type: Map,
            of: Number,
        },
        selectedDate: {
            type: String,
        },
        selectedRateId: { type: Number },
        selectedStartTimeId: { type: Number },

    },
    { _id: false }
);

const OrderSchema = new mongoose.Schema<OrderDocument>(
    {
        orderId: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        notes: { type: String },
        reservationIds: [{ type: String, index: true }],
        reservationReferences: [{ type: String, index: true }],
        items: [ItemSchema],
        payment_id: { type: String, index: true },
        payment_method_id: { type: String, index: true },
        tax_number: { type: String },
        transaction_id: [{ type: String }],
        companyName: { type: String },
        isCompany: { type: Boolean },
        activityBookingIds:[{type:String}],
        activityBookingReferences:[{type:String}]
    },
    { timestamps: true }
);

const OrderModel: mongoose.Model<OrderDocument> = mongoose.models.Order || mongoose.model<OrderDocument>("Order", OrderSchema);

export default OrderModel;