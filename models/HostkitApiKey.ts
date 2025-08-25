"use server";
import mongoose from "mongoose";

export interface HostkitApiKeyDocument extends Document {
    listingId: string;
    hostkitApiKey: string;
    admin: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IHostkitApiKeyDocument {
    listingId: string;
    hostkitApiKey: string;
    admin: string;
    createdAt: Date;
    updatedAt: Date;
}

const HostkitApiKeySchema = new mongoose.Schema<HostkitApiKeyDocument>(
    {
        listingId: { type: String, required: true, unique: true, index: true },
        hostkitApiKey: { type: String, required: true },
        admin: { type: String, required: true },
    },
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

const HostkitApiKeyModel: mongoose.Model<HostkitApiKeyDocument> =
    mongoose.models.HostkitApiKeys || mongoose.model<HostkitApiKeyDocument>("HostkitApiKeys", HostkitApiKeySchema);

export default HostkitApiKeyModel;