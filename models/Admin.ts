"use server";
import mongoose, { Document } from "mongoose";

interface AdminDocument extends Document {
    sub: string,
    email: string,
    password: string,
    emailVerified: boolean
}

const AdminSchema = new mongoose.Schema<AdminDocument>(
    {
        sub: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        emailVerified: { type: Boolean, default: false }
    },
    { timestamps: true }
);

const AdminModel: mongoose.Model<AdminDocument> = mongoose.models.Admin || mongoose.model<AdminDocument>("Admin", AdminSchema);

export default AdminModel;