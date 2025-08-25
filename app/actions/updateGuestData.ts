"use server";

import { connectDB } from "@/lib/mongodb";
import GuestDataModel, { Guest } from "@/models/GuestData";
import { verifySession } from "@/utils/verifySession";

export async function updateGuestData({ booking_code, guest_data }: { booking_code: string, guest_data: Guest[] }) {
    try {
        if (!(await verifySession())) {
            throw new Error("Unauthorized");
        }
        await connectDB();
        const updated = await GuestDataModel.findOneAndUpdate({ booking_code }, { guest_data }, { new: true }).lean();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return updated ? { ...updated, _id: updated._id.toString(), guest_data: updated.guest_data.map((guest) => ({ ...guest, _id: (guest as any)._id.toString() })) } : undefined;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}