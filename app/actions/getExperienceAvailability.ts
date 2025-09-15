"use server"

import { ExperienceAvailabilityDto, bokunRequest } from "@/utils/bokun-requests";
import { verifySession } from "@/utils/verifySession";
import { addMonths, format } from "date-fns";

export async function GetActivityAvailability(id: string, startDate?: Date, endDate?: Date): Promise<{ [key: string]: ExperienceAvailabilityDto } | false> {
    if (!(await verifySession())) {
        throw new Error("unauthorized");
    }
    try {
        const response = await bokunRequest<{ [key: string]: ExperienceAvailabilityDto }>({ method: "GET", path: `/activity.json/${id}/availabilities?start=${format(startDate ?? new Date(), 'yyyy-MM-dd')}&end=${format(endDate ?? addMonths(new Date(), 10), 'yyyy-MM-dd')}` });
        if (response.success) {
            return response;
        }
        return false;
    } catch (error) {
        console.log(error);
        return false;
    }
}