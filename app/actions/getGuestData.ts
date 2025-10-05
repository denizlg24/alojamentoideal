"use server";

import { connectDB } from "@/lib/mongodb";
import { UnauthorizedError } from "@/lib/utils";
import GuestDataModel from "@/models/GuestData";
import { verifySession } from "@/utils/verifySession";

export async function getGuestData(booking_code: string, listing_id: string) {
    try {
        if (!(await verifySession())) {
            throw new UnauthorizedError();
        }
        await connectDB();
        const foundGuestData = await GuestDataModel.findOne({ booking_code }).lean();
        if (foundGuestData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { ...foundGuestData, _id: foundGuestData._id.toString(), guest_data: foundGuestData.guest_data.map((guest) => ({ ...guest, _id: (guest as any)._id.toString() })) };
        }
        const newGuestData = new GuestDataModel({ booking_code, listing_id, guest_data: [], synced: false, succeeded: false });
        await newGuestData.save();
        return { booking_code, listing_id, guest_data: [], synced: false, succeeded: false };
    } catch {
        return undefined;
    }
}