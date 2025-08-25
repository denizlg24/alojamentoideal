"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import HostkitApiKeyModel from "@/models/HostkitApiKey";
import { verifySession } from "@/utils/verifySession";

export async function editHostkitApiKey({ listingId, apiKey }: { listingId: string, apiKey: string }) {
    if (!(await verifySession())) {
        throw new Error("Unauthorized")
    }
    const session = await auth();
    if (!session) {
        throw new Error("Unauthorized")
    }
    try {
        await connectDB();

        await HostkitApiKeyModel.findOneAndUpdate({ listingId }, { hostkitApiKey: apiKey, admin: session.user?.id });
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }

}