

"use server";
import mongoose, { Document } from "mongoose";

export interface Guest {
    first_name: string;
    last_name: string;
    document_type: string;
    document_number: string;
    document_country: string;
    nationality: string;
    birthday: string;
    arrival: string;
    departure: string;
    country_residence: string;
    city_residence: string;
}

interface GuestDataDocument extends Document {
    booking_code: string;
    listing_id: string;
    guest_data: Guest[];
    synced: boolean;
    succeeded: boolean;
}

export interface IGuestDataDocument {
    booking_code: string;
    listing_id: string;
    guest_data: Guest[];
    synced: boolean;
    succeeded: boolean;
}



const GuestSchema = new mongoose.Schema<Guest>({
    first_name: { type: String },
    last_name: { type: String },
    document_type: { type: String },
    document_number: { type: String },
    document_country: { type: String },
    nationality: { type: String },
    birthday: { type: String },
    arrival: { type: String },
    departure: { type: String },
    country_residence: { type: String },
    city_residence: { type: String },
});

const GuestDataSchema = new mongoose.Schema<GuestDataDocument>(
    {
        listing_id: { type: String },
        booking_code: { type: String, unique: true },
        guest_data: [GuestSchema],
        synced: { type: Boolean, default: false },
        succeeded: { type: Boolean, default: false }
    },
    { timestamps: true }
);

const GuestDataModel: mongoose.Model<GuestDataDocument> = mongoose.models.GuestData || mongoose.model<GuestDataDocument>("GuestData", GuestDataSchema);

export default GuestDataModel;