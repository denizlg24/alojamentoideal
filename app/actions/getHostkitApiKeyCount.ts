"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import HostkitApiKeyModel from "@/models/HostkitApiKey";
import { verifySession } from "@/utils/verifySession";

export async function getHostkitApiKeyCount() {
    if (!(await verifySession())) {
        throw new Error("Unauthorized")
    }
    const session = await auth();
    if (!session) {
        throw new Error("Unauthorized")
    }
    await connectDB();

    const count = await HostkitApiKeyModel.countDocuments();
    return count;
}