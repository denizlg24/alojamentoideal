"use server"

import { connectDB } from "@/lib/mongodb";
import { generateUniqueId } from "@/lib/utils";
import AdminModel from "@/models/Admin";
import { verifySession } from "@/utils/verifySession";
import bcrypt from "bcryptjs";

export async function createAdminAccount({ email, password }: { email: string, password: string }) {
    if (!(await verifySession())) {
        return { success: false, error: "unauthorized" }
    }
    try {
        await connectDB();
        const emailFind = await AdminModel.findOne({ email });
        if (emailFind) {
            return { success: false, error: 'email-taken' }
        }
        const hashedPassword = bcrypt.hashSync(password, 10);
        const sub = generateUniqueId();
        const newAdmin = new AdminModel({
            sub,
            email,
            password: hashedPassword,
            emailVerified: false
        });
        await newAdmin.save();
        return { success: true };
    } catch {
        return { success: false, error: "server-error" }
    }
}