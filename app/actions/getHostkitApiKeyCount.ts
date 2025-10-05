"use server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { UnauthorizedError } from "@/lib/utils";
import HostkitApiKeyModel from "@/models/HostkitApiKey";
import { verifySession } from "@/utils/verifySession";

export async function getHostkitApiKeyCount() {
    if (!(await verifySession())) {
        throw new UnauthorizedError();
    }
    const session = await auth();
    if (!session) {
        throw new UnauthorizedError();
    }
    await connectDB();

    const count = await HostkitApiKeyModel.countDocuments();
    return count;
}