import { CustomFieldType } from "@/schemas/custom-field.schema";
import { Card, CardAction } from "../ui/card";
import { format } from "date-fns";
import { Separator } from "../ui/separator";
import {
  Check,
  Edit,
  Info,
  Loader2Icon,
  MapPinned,
  MessageCircle,
  PlusCircle,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FullListingType } from "@/schemas/full-listings.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { ReservationType } from "@/schemas/reservation.schema";
import {
  formatSecondsToHHMM,
  formatTime,
  isTimeBetweenAndValid,
  isTimeUpTo,
  localeMap,
  parseTimeToSeconds,
} from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useLocale, useTranslations } from "next-intl";

export const PropertyInfoCard = ({
  listingId,
  reservationId,
  start_date,
  end_date,
  adults,
  children_,
  infants,
  custom_fields,
}: {
  listingId: number;
  reservationId: string;
  start_date: string;
  end_date: string;
  adults: number;
  children_: number;
  infants: number;
  custom_fields: CustomFieldType[] | undefined;
}) => {
  const locale = useLocale();
  const t = useTranslations("propertyCard");
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<FullListingType | undefined>(
    undefined
  );
  const [reservation, setReservation] = useState<ReservationType | undefined>(
    undefined
  );

  const [arrivalLoading, setArrivalLoading] = useState(false);
  const [departureLoading, setDepartureLoading] = useState(false);

  useEffect(() => {
    const getListingInfo = async () => {
      setLoading(true);
      const info = await hostifyRequest<FullListingType>(
        `listings/${listingId}`,
        "GET",
        [{ key: "include_related_objects", value: 1 }],
        undefined,
        undefined
      );
      const getReservationInfo = async () => {
        setLoading(true);
        const info = await hostifyRequest<{ reservation: ReservationType }>(
          `reservations/${reservationId}`,
          "GET",
          undefined,
          undefined,
          undefined
        );
        if (info.reservation) {
          setReservation(info.reservation);
          setPlannedArrival(info.reservation.planned_arrival || "");
          setPlannedDeparture(info.reservation.planned_departure || "");
        } else {
          setReservation(undefined);
        }
      };
      if (info.success) {
        setListing(info);
        await getReservationInfo();
      } else {
        setListing(undefined);
      }
      setLoading(false);
    };
    if (listingId && reservationId) {
      getListingInfo();
    }
  }, [listingId, reservationId]);

  const guestInfoCustomField = custom_fields?.find(
    (a) => a.name == "hostkit_url"
  );
  const guestInfoCustomDoneField = custom_fields?.find(
    (b) => b.name == "hostkit_done"
  );

  const [plannedArrival, setPlannedArrival] = useState("");
  const [plannedDeparture, setPlannedDeparture] = useState("");
  const [arrivingError, setArrivingError] = useState("");
  const [leavingError, setLeavingError] = useState("");

  useEffect(() => {
    if (!listing?.listing) {
      return;
    }

    const timeOut = setTimeout(() => {
      if (
        plannedArrival &&
        !isTimeBetweenAndValid(
          plannedArrival,
          listing?.listing.checkin_start,
          listing?.listing.checkin_end
        )
      ) {
        setArrivingError("invalid_time");
      } else {
        setArrivingError("");
      }
    }, 300);

    return () => {
      clearTimeout(timeOut);
    };
  }, [listing?.listing, plannedArrival]);

  useEffect(() => {
    if (!listing?.listing) {
      return;
    }
    const timeOut = setTimeout(() => {
      if (
        plannedDeparture &&
        !isTimeUpTo(plannedDeparture, listing?.listing.checkout)
      ) {
        setLeavingError("invalid_time");
      } else {
        setLeavingError("");
      }
    }, 300);

    return () => {
      clearTimeout(timeOut);
    };
  }, [listing?.listing, plannedDeparture]);
  const isMobile = useIsMobile();
  if (loading || !listing || !reservation) {
    return <Skeleton className="w-full h-[200px]" />;
  }

  return (
    <Card className="w-full flex flex-col gap-3 relative p-4">
      <div className="w-full flex sm:flex-row flex-col items-start justify-between gap-3 relative ">
        <Image
          src={listing.photos[0].original_file}
          alt="cart-logo"
          width={1080}
          height={1080}
          className="w-full sm:max-w-[200px] h-auto aspect-video! max-h-[200px] object-cover rounded-lg"
        />
        <div className="w-full grow flex flex-col truncate gap-1">
          <div className="flex flex-col w-full gap-0">
            <h1 className="w-full font-semibold truncate">
              {listing.listing.name}
            </h1>
            <h2 className="text-sm">
              {format(new Date(start_date), "MMM, dd", {
                locale: localeMap[locale as keyof typeof localeMap],
              })}{" "}
              -{" "}
              {format(new Date(end_date), "MMM, dd", {
                locale: localeMap[locale as keyof typeof localeMap],
              })}
            </h2>
          </div>
          <Separator />
          <div className="flex flex-col">
            <p className="text-xs font-semibold">{t("trip_details")}</p>
            <p className="text-xs">
              {t("nights", {
                count:
                  (new Date(end_date).getTime() -
                    new Date(start_date).getTime()) /
                  (1000 * 60 * 60 * 24),
                adults: adults,
                children:
                  children_ > 0 ? t("children_text", { count: children_ }) : "",
                infants:
                  infants > 0 ? t("infants_text", { count: infants }) : "",
              })}
            </p>
          </div>
          <Separator />
          {guestInfoCustomField &&
          guestInfoCustomDoneField &&
          guestInfoCustomDoneField.value == "true" ? (
            <div className="flex flex-row gap-1 items-center text-xs">
              <Check className="text-green-700 w-4! h-4!" />
              <p className="truncate max-w-[90%]">{t("guest_info_provided")}</p>
            </div>
          ) : (
            <div className="flex flex-row gap-1 items-center text-xs">
              <X className="text-destructive w-4! h-4!" />
              <p className="truncate max-w-[90%]">{t("guest_info_missing")}</p>
              {isMobile ? (
                <Popover>
                  <PopoverTrigger>
                    <Info className="w-4! h-4!" />
                  </PopoverTrigger>
                  <PopoverContent className="w-full max-w-[300px] text-xs">
                    {(!guestInfoCustomField ||
                      !guestInfoCustomDoneField ||
                      !guestInfoCustomDoneField.value) && (
                      <>{t("guest_info_loading")}</>
                    )}
                    {t("guest_info_required")}
                  </PopoverContent>
                </Popover>
              ) : (
                <HoverCard>
                  <HoverCardTrigger>
                    <Info className="w-4! h-4!" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-full max-w-[300px] text-xs">
                    {(!guestInfoCustomField ||
                      !guestInfoCustomDoneField ||
                      !guestInfoCustomDoneField.value) && (
                      <>{t("guest_info_loading")}</>
                    )}
                    {t("guest_info_required")}
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="w-full sm:grid flex flex-col grid-cols-2 gap-4 items-stretch">
        <div className="col-span-1 w-full flex flex-col gap-1">
          <p className="text-sm">
            {t("checkin", {
              start: formatTime(listing.listing.checkin_start),
              end: formatTime(listing.listing.checkin_end),
            })}
          </p>
          <div className="w-full flex flex-row gap-1 items-center ">
            <p className="text-sm">{t("arriving")}</p>
            <Input
              value={plannedArrival}
              onChange={(e) => {
                setPlannedArrival(e.target.value);
              }}
              placeholder="15:00"
              name="check-in"
              className="grow max-w-24 p-1! px-2! h-fit"
            />
            <Button
              onClick={async () => {
                if (
                  !isTimeBetweenAndValid(
                    plannedArrival,
                    listing.listing.checkin_start,
                    listing.listing.checkin_end
                  )
                ) {
                  return;
                }
                const time = formatSecondsToHHMM(
                  parseTimeToSeconds(plannedArrival) || 0
                );
                if (time) {
                  setArrivalLoading(true);
                  hostifyRequest<{ success: boolean }>(
                    `reservations/${reservation.id}`,
                    "PUT",
                    undefined,
                    {
                      planned_arrival: `${time}:00`,
                    },
                    undefined,
                    undefined
                  );
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  setPlannedArrival(`${time}:00`);
                  setReservation((prev) => {
                    if (prev) {
                      return { ...prev, planned_arrival: `${time}:00` };
                    }
                    return prev;
                  });
                  setArrivalLoading(false);
                }
              }}
              disabled={
                arrivalLoading ||
                !plannedArrival ||
                plannedArrival == reservation.planned_arrival ||
                arrivingError
                  ? true
                  : false
              }
              className="w-7 h-7 hover:cursor-pointer"
            >
              {arrivalLoading ? (
                <Loader2Icon className="animate-spin" />
              ) : !reservation.planned_arrival ? (
                <Check />
              ) : (
                <Edit />
              )}
            </Button>
          </div>
          {arrivingError && (
            <p className="text-xs font-semibold text-destructive">
              {t(arrivingError)}
            </p>
          )}
        </div>

        <div className="col-span-1 w-full flex flex-col gap-1">
          <p className="text-sm">
            {listing.listing.checkout
              ? t("checkout", { time: listing.listing.checkout })
              : t("checkout_anytime")}
          </p>
          <div className="w-full flex flex-row gap-1 items-center ">
            <p className="text-sm">{t("leaving")}</p>
            <Input
              value={plannedDeparture}
              onChange={(e) => {
                setPlannedDeparture(e.target.value);
              }}
              placeholder="21:00"
              name="check-out"
              className="grow max-w-24 p-1! px-2! h-fit"
            />
            <Button
              onClick={async () => {
                if (!isTimeUpTo(plannedDeparture, listing?.listing.checkout)) {
                  return;
                }
                const time = formatSecondsToHHMM(
                  parseTimeToSeconds(plannedDeparture) || 0
                );
                if (time) {
                  setDepartureLoading(true);
                  hostifyRequest<{ success: boolean }>(
                    `reservations/${reservation.id}`,
                    "PUT",
                    undefined,
                    {
                      planned_departure: `${time}:00`,
                    },
                    undefined,
                    undefined
                  );
                  await new Promise((resolve) => setTimeout(resolve, 300));
                  setPlannedDeparture(`${time}:00`);
                  setReservation((prev) => {
                    if (prev) {
                      return { ...prev, planned_departure: `${time}:00` };
                    }
                    return prev;
                  });
                  setDepartureLoading(false);
                }
              }}
              disabled={
                departureLoading ||
                !plannedDeparture ||
                plannedDeparture == reservation.planned_departure ||
                leavingError
                  ? true
                  : false
              }
              className="w-7 h-7 hover:cursor-pointer"
            >
              {departureLoading ? (
                <Loader2Icon className="animate-spin" />
              ) : !reservation.planned_departure ? (
                <Check />
              ) : (
                <Edit />
              )}
            </Button>
          </div>
          {leavingError && (
            <p className="text-xs font-semibold text-destructive">
              {t(leavingError)}
            </p>
          )}
        </div>
      </div>
      <CardAction className="flex flex-row gap-1 w-full flex-wrap">
        {guestInfoCustomField &&
          guestInfoCustomDoneField &&
          guestInfoCustomDoneField.value == "false" && (
            <Button asChild className="grow">
              <Link href={guestInfoCustomField.value || ""} target="_blank">
                <PlusCircle />
                {t("add_guest_info")}
              </Link>
            </Button>
          )}
        <Button asChild className="grow">
          <Link
            href={`https://www.google.com/maps/place/${encodeURI(
              listing.listing.address
            )}`}
            target="_blank"
          >
            <MapPinned />
            {t("get_directions")}
          </Link>
        </Button>
        <Button asChild className="grow" variant={"outline"}>
          <Link href={"#"}>
            <MessageCircle />
            {t("contact_host")}
          </Link>
        </Button>
      </CardAction>
    </Card>
  );
};
