"use server"

import { UnauthorizedError } from "@/lib/utils";
import { ExperienceAvailabilityDto } from "@/utils/bokun-requests";
import { bokunRequest } from "@/utils/bokun-server";
import { verifySession } from "@/utils/verifySession";
import { addMonths, format } from "date-fns";

export async function GetActivityAvailability(id: string, startDate?: string, endDate?: string): Promise<{ [key: string]: ExperienceAvailabilityDto } | false> {
    if (!(await verifySession())) {
        throw new UnauthorizedError();
    }
    try {
        const response = await bokunRequest<{ [key: string]: ExperienceAvailabilityDto }>({ method: "GET", path: `/activity.json/${id}/availabilities?start=${startDate?? format(new Date(),"yyyy-MM-dd")}&end=${endDate ?? format(addMonths(new Date(), 10), 'yyyy-MM-dd')}` });
        if (response.success) {
            return response;
        }
        return false;
    } catch (error) {
        console.log(error);
        return false;
    }
}