"use server"

import { ExperienceAvailabilityDto, bokunRequest } from "@/utils/bokun-requests";
import { addMonths, format } from "date-fns";

export async function GetActivityAvailability(id: string): Promise<{ [key: string]: ExperienceAvailabilityDto } | false> {
    try {
        const response = await bokunRequest<{ [key: string]: ExperienceAvailabilityDto }>({ method: "GET", path: `/activity.json/${id}/availabilities?start=${format(new Date(), 'yyyy-MM-dd')}&end=${format(addMonths(new Date(), 10), 'yyyy-MM-dd')}` });
        if (response.success) {
            return response;
        }
        return false;
    } catch (error) {
        console.log(error);
        return false;
    }
}