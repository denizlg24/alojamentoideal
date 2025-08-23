"use server"

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { hostifyRequest } from "@/utils/hostify-request";
import { verifySession } from "@/utils/verifySession";

export async function cancelReservation(reservation_id: string, transaction_id: string) {
    if (!(await verifySession())) {
        throw new Error("Unauthorized")
    }
    const session = await auth();
    if (!session) {
        throw new Error("Unauthorized")
    }
    await connectDB();
    await hostifyRequest<{ success: boolean }>(
        `reservations/${reservation_id}`,
        "PUT",
        undefined,
        {
            status: "cancelled_by_host",
        },
        undefined,
        undefined
    );

    await hostifyRequest<{ success: boolean }>(
        `transactions/${transaction_id}`,
        "PUT",
        undefined,
        {
            arrival_date: "",
            is_completed: 0,
            details: `Canceled reservation by: ${session.user?.id}`
        },
        undefined,
        undefined
    );

}