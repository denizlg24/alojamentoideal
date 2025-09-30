"use server";

import { connectDB } from "@/lib/mongodb";
import AdminModel from "@/models/Admin";

export async function getAdminEmails(){
    try {
        await connectDB();
        const admins = await AdminModel.find().lean();
        return admins.map((admin) => admin.email);
    } catch (error) {
        console.log("Error getting admin emails: ",error);
        return [];
    }
}