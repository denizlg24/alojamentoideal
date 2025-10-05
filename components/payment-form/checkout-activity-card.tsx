"use client";

import { TourItem, useCart } from "@/hooks/cart-context";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  ExperienceAvailabilityDto,
  ExperienceRateDto,
  ExperienceStartTimeDto,
  FullExperienceType,
} from "@/utils/bokun-requests";
import { GetActivityAvailability } from "@/app/actions/getExperienceAvailability";
import { format, isSameDay } from "date-fns";
import { getExperience } from "@/app/actions/getExperience";
import { Skeleton } from "../ui/skeleton";
import { Ban, BusFront, PlusCircle, Users } from "lucide-react";
import { Button } from "../ui/button";
export const CheckoutActivityCard = ({
  activityItem,
  index,
}: {
  activityItem: TourItem;
  index: number;
}) => {
  const displayT = useTranslations("tourDisplay");
  const t = useTranslations("checkout-activity-card");
  const [activityInfo, setActivityInfo] = useState<{
    rate: ExperienceRateDto | undefined;
    availability: ExperienceAvailabilityDto | undefined;
    selectedDate: Date;
    selectedTime: ExperienceStartTimeDto | undefined;
    guests: { [categoryId: number]: number };
    activity: FullExperienceType | undefined;
  }>({
    rate: undefined,
    availability: undefined,
    selectedDate: new Date(activityItem.selectedDate),
    selectedTime: undefined,
    guests: activityItem.guests,
    activity: undefined,
  });

  const [loading, setLoading] = useState(true);
  const { disableItem, removeItem } = useCart();
  const extraT = useTranslations("extras");
  useEffect(() => {
    const getActivityInfo = async (id: number) => {
      const experience = await getExperience(id);
      if (!experience.success) {
        setLoading(false);
        return;
      }
      const availability = await GetActivityAvailability(
        id.toString(),
        activityItem.selectedDate
      );
      if (!availability) {
        setLoading(false);
        return;
      }
      const avail = Object.values(availability).find((avails) =>
        isSameDay(activityItem.selectedDate, new Date(avails.date))
      );
      if (!avail) {
        setLoading(false);
        return;
      }
      const selectedRate = avail.rates.find(
        (rate) => rate.id == activityItem.selectedRateId
      );
      if (!selectedRate) {
        setLoading(false);
        return;
      }
      const selectedStartTime =
        activityItem.selectedStartTimeId != 0
          ? experience.startTimes.find(
              (startTime) => startTime.id == activityItem.selectedStartTimeId
            )
          : undefined;
      setLoading(false);
      setActivityInfo((prev) => ({
        ...prev,
        rate: selectedRate,
        availability: avail,
        selectedTime: selectedStartTime,
        activity: experience,
      }));
    };
    if (activityItem && loading) {
      getActivityInfo(activityItem.id);
    }
  }, [activityItem, loading]);

  const [availabilityError, setAvailabilityError] = useState("");
  const [displayPrice, setDisplayPrice] = useState(0);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!activityInfo || !activityInfo.availability || !activityInfo.rate) {
      setAvailabilityError(t("this-activity-is-no-longer-available"));
      if (!activityItem.disabled) {
        disableItem(index);
      }
      return;
    }

    let error = "";

    const totalGuests = Object.values(activityInfo.guests).reduce(
      (sum, val) => sum + val,
      0
    );

    if (!activityInfo.availability.unlimitedAvailability) {
      if (
        activityInfo.availability.availabilityCount == 0 ||
        (activityInfo.availability.availabilityCount ?? 0) < totalGuests
      ) {
        error = t("no-more-room");
      } else if (
        (activityInfo.availability.minParticipantsToBookNow ?? 0) > totalGuests
      ) {
        error = t("min-booking", {
          count: activityInfo.availability.minParticipantsToBookNow ?? 0,
        });
      }
    }

    const prices = activityInfo.availability.pricesByRate.find(
      (priceByRate) => priceByRate.activityRateId == activityInfo.rate!.id
    )?.pricePerCategoryUnit;

    let isPriceAvailable = true;
    let displayPrice = 0;
    for (const priceCategoryId in activityInfo.guests) {
      if (
        Object.prototype.hasOwnProperty.call(
          activityInfo.guests,
          priceCategoryId
        )
      ) {
        const price = prices?.find(
          (price) =>
            price.id.toString() == priceCategoryId &&
            price.maxParticipantsRequired >=
              activityInfo.guests[priceCategoryId] &&
            price.minParticipantsRequired <=
              activityInfo.guests[priceCategoryId]
        );
        if (!price) {
          isPriceAvailable = false;
        } else {
          displayPrice +=
            price.amount.amount *
            (activityInfo.rate.pricedPerPerson ?? true
              ? activityInfo.guests[priceCategoryId]
              : 1);
        }
      }
    }

    if (!isPriceAvailable) {
      error = t("no-more-room");
    } else {
      setDisplayPrice(displayPrice);
      return;
    }

    setAvailabilityError(error);
    if (!activityItem.disabled) {
      disableItem(index);
    }
  }, [activityInfo, activityItem.disabled, disableItem, index, t, loading]);

  if (loading || !activityInfo) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="w-full flex flex-row items-start justify-between gap-2 relative">
      {availabilityError && (
        <div className="absolute w-full lg:max-w-48 md:max-w-46 max-w-40 h-auto aspect-video! sm:flex hidden bg-black/50 top-0 left-0 z-10 rounded  items-center justify-center">
          <Ban className="w-6 h-6 mx-auto my-auto text-white" />
        </div>
      )}
      <Image
        unoptimized
        src={activityItem.photo}
        alt="cart-logo"
        width={1080}
        height={1080}
        className="w-full lg:max-w-48 md:max-w-46 max-w-40 h-auto aspect-video! sm:block hidden object-cover rounded"
      />
      <div className="w-full grow flex flex-col truncate gap-1">
        <div className="flex flex-col w-full gap-0">
          <h1 className="w-full font-semibold truncate">
            {activityInfo.activity?.title}
          </h1>
          <div className="flex flex-row items-center justify-start gap-1">
            <div className="flex flex-row items-center justify-start text-left gap-1">
              <Users className="w-3 h-3 shrink-0" />
              <p className="text-xs">
                {Object.values(activityInfo.guests).reduce(
                  (acc, curr) => acc + curr,
                  0
                )}{" "}
                -
              </p>
            </div>
            {activityInfo.selectedTime ? (
              <h2 className="text-sm">
                {format(activityInfo.selectedDate, "MMMM dd, yyyy")}, starting
                at{" "}
                {format(
                  new Date(
                    activityInfo.selectedDate.setHours(
                      activityInfo.selectedTime.hour
                    )
                  ).setMinutes(activityInfo.selectedTime.minute),
                  "HH:mm a"
                )}
              </h2>
            ) : (
              <h2 className="text-sm">
                {format(activityInfo.selectedDate, "MMMM dd, yyyy")}, flexible
                start time.
              </h2>
            )}
          </div>
        </div>
        <Separator />
        {activityInfo && activityInfo.availability && activityInfo.rate ? (
          <div className="flex flex-row items-center gap-0 flex-wrap justify-start text-left text-xs font-semibold w-full">
            {activityInfo.activity?.meetingType.type != "MEET_ON_LOCATION" && (
              <div className="flex flex-row items-center justify-start gap-1">
                <BusFront className="w-3 h-3 shrink-0" />
                <p>
                {displayT("pickup-available")}{" "}
                  {activityInfo.rate.pickupPricingType == "INCLUDED_IN_PRICE" &&
                    displayT("pickup-included")}
                </p>
              </div>
            )}
            {activityInfo.activity?.privateExperience && (
              <div className="flex flex-row items-center justify-start gap-1">
                <Users className="w-3 h-3 shrink-0" />
                <p className="text-xs text-left">
                  {displayT("private-experience-desc")}
                </p>
              </div>
            )}
            {!activityInfo.activity?.privateExperience && (
              <div className="flex flex-row items-center justify-start gap-1">
                <Users className="w-3 h-3 shrink-0" />
                <p className="text-xs text-left">
                  {activityInfo.availability.bookedParticipants}/
                  {activityInfo.availability.availabilityCount +
                    activityInfo.availability.bookedParticipants}
                  {activityInfo.availability.bookedParticipants >= 0
                    ? `${displayT("booked-people", {
                        count: activityInfo.availability.bookedParticipants,
                      })}`
                    : ""}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-row items-center gap-0 flex-wrap justify-start text-left text-xs font-semibold w-full">
            <Button
              onClick={() => {
                removeItem(index);
              }}
            >
              {t("remove-from-cart")}
            </Button>
          </div>
        )}

        <Separator />
        {(activityInfo.rate?.extraConfigs?.length ?? 0) > 0 && (
          <>
            <div className="flex flex-row items-center flex-wrap gap-1">
              <p className="sm:text-sm text-xs font-semibold flex flex-row items-center gap-1 justify-start text-left">
                <PlusCircle className="text-primary w-4 h-4 shrink-0" />
                {extraT("extras")}:
              </p>
              {activityInfo.activity?.extras
                .filter((extra) =>
                  activityInfo.rate?.extraConfigs.find(
                    (extraConfig) => extraConfig.activityExtraId == extra.id
                  )
                    ? true
                    : false
                )
                .map((extra) => {
                  return (
                    <p className="sm:text-sm text-xs" key={extra.id}>
                      {extra.title}{" "}
                      {activityInfo.rate?.extraConfigs.find(
                        (ex) => ex.activityExtraId == extra.id
                      )?.selectionType == "PRESELECTED"
                        ? activityInfo.rate?.extraConfigs.find(
                            (ex) => ex.activityExtraId == extra.id
                          )?.pricingType == "INCLUDED_IN_PRICE"
                          ? extraT("included-in-price")
                          : extraT("priced-separately")
                        : ""}
                    </p>
                  );
                })}
            </div>
            <Separator className="" />
          </>
        )}
        {availabilityError ? (
          <p className="text-xs text-destructive">{availabilityError}</p>
        ) : (
          <p className="text-xs">
            <span className="font-semibold">{t("total")}:</span> {displayPrice}{" "}
            €
          </p>
        )}
      </div>
    </div>
  );
};
