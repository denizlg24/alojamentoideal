"use client";

import { TourItem } from "@/hooks/cart-context";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  ExperienceAvailabilityDto,
  ExperienceRateDto,
  ExperienceStartTimeDto,
} from "@/utils/bokun-requests";
import { GetActivityAvailability } from "@/app/actions/getExperienceAvailability";
import { addDays, isSameDay } from "date-fns";
export const CheckoutActivityCard = ({
  activityItem,
}: {
  activityItem: TourItem;
}) => {
  const t = useTranslations("checkout-activity-card");
  const [activityInfo, setActivityInfo] = useState<{
    rate: ExperienceRateDto | undefined;
    availability: ExperienceAvailabilityDto | undefined;
    selectedDate: Date;
    selectedTime: ExperienceStartTimeDto | undefined;
  }>({
    rate: undefined,
    availability: undefined,
    selectedDate: activityItem.selectedDate,
    selectedTime: undefined,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getActivityInfo = async (id: number) => {
      const availability = await GetActivityAvailability(
        id.toString(),
        activityItem.selectedDate,
        addDays(activityItem.selectedDate, 1)
      );
      if (!availability) {
        return;
      }
      const avail = Object.values(availability).find((avails) =>
        isSameDay(activityItem.selectedDate, new Date(avails.date))
      );
      if (!avail) {
        return;
      }
      const selectedRate = avail.rates.find(
        (rate) => rate.id == activityItem.selectedRateId
      );
    };
    if (activityItem) {
      getActivityInfo(activityItem.id);
    }
  }, [activityItem]);
  return (
    <div className="w-full flex flex-row items-start justify-between gap-2 relative">
      <Image
        src={activityItem.photo}
        alt="cart-logo"
        width={1080}
        height={1080}
        className="w-full max-w-48 h-auto aspect-video! object-cover rounded"
      />
      <div className="w-full grow flex flex-col truncate gap-1">
        <div className="flex flex-col w-full gap-0">
          <h1 className="w-full font-semibold truncate">{activityItem.name}</h1>
          <h2 className="text-sm"></h2>
        </div>
        <Separator />
        <div className="flex flex-col">
          <p className="text-xs font-semibold"></p>
          <p className="text-xs"></p>
        </div>
        <Separator />
        <p className="text-xs">
          <span className="font-semibold">{t("total")}:</span>{" "}
          {activityItem.price} €
        </p>
      </div>
    </div>
  );
};
