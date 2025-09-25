"use server"

import { ExperienceAvailabilityDto } from "@/utils/bokun-requests";
import { bokunRequest } from "@/utils/bokun-server";
import { verifySession } from "@/utils/verifySession";
import { addMonths, format } from "date-fns";

export async function GetActivityAvailability(id: string, startDate?: string, endDate?: string): Promise<{ [key: string]: ExperienceAvailabilityDto } | false> {
    if (!(await verifySession())) {
        throw new Error("unauthorized");
    }
    try {
        const response = await bokunRequest<{ [key: string]: ExperienceAvailabilityDto }>({ method: "GET", path: `/activity.json/${id}/availabilities?start=${startDate})}&end=${endDate ?? format(addMonths(new Date(), 10), 'yyyy-MM-dd')}` });
        console.log(response);
        if (response.success) {
            return response;
        }
        return false;
    } catch (error) {
        console.log(error);
        return false;
    }
}