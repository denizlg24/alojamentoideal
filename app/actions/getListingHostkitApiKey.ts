"use server";

import { connectDB } from "@/lib/mongodb";
import { UnauthorizedError } from "@/lib/utils";
import HostkitApiKeyModel from "@/models/HostkitApiKey";
import { verifySession } from "@/utils/verifySession";

export async function getListingHostkitApiKey(listingId: string) {
    if (!(await verifySession())) {
        throw new UnauthorizedError();
    }
    await connectDB();
    const hostkitApiKey = await HostkitApiKeyModel.findOne({ listingId }).lean();
    if (hostkitApiKey) {
        return { ...hostkitApiKey, _id: hostkitApiKey._id.toString() }
    }
    return undefined
}