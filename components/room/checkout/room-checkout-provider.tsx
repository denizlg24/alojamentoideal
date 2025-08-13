"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/navigation";
import { CalendarType } from "@/schemas/calendar.schema";
import { FullListingType } from "@/schemas/full-listings.schema";
import { PriceType } from "@/schemas/price.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { eachDayOfInterval, format } from "date-fns";
import { ArrowUpRightFromSquareIcon, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { RoomCheckoutForm } from "./room-checkout-form";
import { useTranslations } from "next-intl";
import { localeMap } from "@/lib/utils";

export const RoomCheckoutProvider = ({ id }: { id: string }) => {
  const locale = useLocale();
  const [tripDetails, setTripDetails] = useState({
    adults: 0,
    children: 0,
    infants: 0,
    pets: 0,
    start_date: "",
    end_date: "",
  });
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [rangeBooked, setRangeBooked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listingInfo, setListingInfo] = useState<FullListingType | undefined>(
    undefined
  );
  const [stayPrice, setStayPrice] = useState<PriceType | undefined>(undefined);
  const supportedLocales = [
    "auto",
    "ar",
    "bg",
    "cs",
    "da",
    "de",
    "el",
    "en",
    "en-AU",
    "en-CA",
    "en-NZ",
    "en-GB",
    "es",
    "es-ES",
    "es-419",
    "et",
    "fi",
    "fil",
    "fr",
    "fr-CA",
    "fr-FR",
    "he",
    "hu",
    "id",
    "it",
    "ja",
    "ko",
    "lt",
    "lv",
    "ms",
    "mt",
    "nb",
    "nl",
    "pl",
    "pt",
    "pt-BR",
    "ro",
    "ru",
    "sk",
    "sl",
    "sv",
    "th",
    "tr",
    "vi",
    "zh",
    "zh-HK",
    "zh-TW",
  ] as const;

  type StripeLocale = (typeof supportedLocales)[number];

  const isValidLocale = (locale: string): locale is StripeLocale => {
    return supportedLocales.includes(locale as StripeLocale);
  };

  const safeLocale: StripeLocale = isValidLocale(locale) ? locale : "auto";

  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    { locale: safeLocale }
  );
  const t = useTranslations("checkout");

  const router = useRouter();

  useEffect(() => {
    if (
      (!detailsLoading && (!tripDetails.start_date || !tripDetails.end_date)) ||
      (!detailsLoading && !id)
    ) {
      if (document.referrer && document.referrer !== window.location.href) {
        router.back();
      } else {
        router.push("/");
      }
      return;
    }
    if (!id || !detailsLoading) {
      return;
    }
    const start_date = localStorage.getItem(`room-${id}-start_date`);
    const end_date = localStorage.getItem(`room-${id}-end_date`);
    const adults = parseInt(localStorage.getItem(`room-${id}-adults`) || "0");
    const children = parseInt(
      localStorage.getItem(`room-${id}-children`) || "0"
    );
    const infants = parseInt(localStorage.getItem(`room-${id}-infants`) || "0");
    const pets = parseInt(localStorage.getItem(`room-${id}-pets`) || "0");

    if (start_date && end_date && adults > 0) {
      setTripDetails({
        start_date,
        end_date,
        adults,
        children,
        infants,
        pets,
      });
    }
    setDetailsLoading(false);
  }, [id, detailsLoading, router, tripDetails]);

  useEffect(() => {
    if (
      detailsLoading ||
      !id ||
      !tripDetails.start_date ||
      !tripDetails.end_date
    ) {
      return;
    }

    const verifyValidityAndLoadInfo = async () => {
      const calendar = await hostifyRequest<{ calendar: CalendarType[] }>(
        `calendar?listing_id=${id}&start_date=${format(
          new Date(),
          "yyyy-MM-dd"
        )}`,
        "GET",
        undefined,
        undefined,
        undefined,
        { page: 1, perPage: 365 }
      );

      const dateRange = eachDayOfInterval({
        start: new Date(tripDetails.start_date),
        end: new Date(tripDetails.end_date),
      }).map((date) => date.toISOString().split("T")[0]);

      const isRangeBooked = dateRange.some((date) =>
        calendar.calendar.some(
          (entry) =>
            entry.date === date &&
            (entry.status === "booked" || entry.status === "unavailable")
        )
      );

      setRangeBooked(isRangeBooked);

      const info = await hostifyRequest<FullListingType>(
        `listings/${id}`,
        "GET",
        [{ key: "include_related_objects", value: 1 }],
        undefined,
        undefined
      );
      setListingInfo(info);
      if (isRangeBooked) {
        setLoading(false);
        return;
      }
      const price = await hostifyRequest<{ price: PriceType }>(
        `listings/price?listing_id=${id}&start_date=${tripDetails.start_date}&end_date=${tripDetails.end_date}`,
        "GET",
        [
          { key: "guests", value: tripDetails.adults + tripDetails.children },
          { key: "include_fees", value: 1 },
          { key: "pets", value: tripDetails.pets },
        ],
        undefined,
        undefined,
        undefined
      );
      const nights =
        (new Date(tripDetails.end_date).getTime() -
          new Date(tripDetails.start_date).getTime()) /
        (1000 * 60 * 60 * 24);
      let overchargeToDeduct = 0;

      price.price.fees = price.price.fees.map((fee) => {
        if (fee.fee_name.includes("City Tax")) {
          const maxQuantity = tripDetails.adults * nights;
          if (fee.quantity > maxQuantity) {
            const excess = fee.quantity - maxQuantity;
            const unitAmount = fee.total / fee.quantity;
            const excessAmount = unitAmount * excess;
            overchargeToDeduct += excessAmount;

            return {
              ...fee,
              quantity: maxQuantity,
              total: unitAmount * maxQuantity,
              total_net: (fee.total_net / fee.quantity) * maxQuantity,
              total_tax: (fee.total_tax / fee.quantity) * maxQuantity,
            };
          }
        }
        return fee;
      });

      price.price.total -= overchargeToDeduct;
      setStayPrice(price.price);
      setLoading(false);
    };

    verifyValidityAndLoadInfo();
  }, [detailsLoading, id, tripDetails]);

  return (
    <div className="md:grid flex flex-col-reverse grid-cols-4 w-full max-w-7xl px-4 pt-12 gap-8 relative md:items-stretch items-center">
      {(detailsLoading || loading) && (
        <>
          <Card className="w-full col-span-2 sm:p-6 p-4 flex flex-col gap-2">
            <Skeleton className="w-full aspect-[2] h-auto max-h-[250px] object-cover rounded-2xl" />
            <Skeleton className="w-[80%] h-8" />
            <Skeleton className="w-[20%] h-4" />
            <Separator />
            <div className="w-full grid grid-cols-3 items-center">
              <div className="w-full col-span-1 flex flex-col gap-1">
                <Skeleton className="w-[20%] h-4" />
                <Skeleton className="col-span-1  h-8 w-full" />
              </div>
              <ChevronRight className="col-span-1 w-full" />
              <div className="w-full col-span-1 flex flex-col gap-1">
                <Skeleton className="w-[20%] h-4" />
                <Skeleton className="col-span-1  h-8 w-full" />
              </div>
            </div>
            <Separator />
            <Skeleton className="w-full h-[200px]" />
            <Separator />
            <div className="flex flex-row justify-between items-center w-full">
              <Skeleton className="w-[15%] h-8" />
              <Skeleton className="w-[10%] h-8" />
            </div>
          </Card>
          <Card className="w-full col-span-2 sm:p-6 p-4">
            <Skeleton className="w-full h-full" />
          </Card>
        </>
      )}
      {!(detailsLoading || loading) && listingInfo && (
        <Card className="w-full col-span-2 sm:p-6 p-4 flex flex-col gap-2 h-full">
          <Image
            src={listingInfo.photos[0].original_file}
            alt={"thumbnail photo"}
            width={1920}
            height={1080}
            className="w-full aspect-[2] h-auto max-h-[250px] object-cover rounded-2xl"
          />
          <div className="flex flex-col gap-0">
            <h1 className="font-semibold">
              {listingInfo.listing.name || listingInfo.listing.nickname}
            </h1>
            <h2 className="text-sm">
              {listingInfo.listing.neighbourhood || listingInfo.listing.city}
            </h2>
          </div>
          <Separator />
          <div className="w-full flex flex-row justify-between items-center gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs">{t("checkin")}</p>
              <p className="font-semibold sm:text-base text-sm">
                {format(new Date(tripDetails.start_date), "MMM dd, yyyy", {
                  locale: localeMap[locale as keyof typeof localeMap],
                })}
              </p>
            </div>
            <ChevronRight className="w-6 h-6" />
            <div className="flex flex-col gap-1">
              <p className="text-xs">{t("checkout")}</p>
              <p className="font-semibold sm:text-base text-sm">
                {format(new Date(tripDetails.end_date), "MMM dd, yyyy", {
                  locale: localeMap[locale as keyof typeof localeMap],
                })}
              </p>
            </div>
          </div>
          <Separator />
          <div className="w-full flex flex-col gap-2">
            {!rangeBooked &&
              stayPrice &&
              stayPrice.fees.map((fee) => {
                return (
                  <div
                    key={fee.fee_id}
                    className="w-full flex flex-row gap-2 items-center justify-between"
                  >
                    <div className="flex flex-row items-center justify-start gap-1 truncate w-full">
                      <p className="md:text-base text-sm">{fee.fee_name}</p>
                      {fee.charge_type_label && (
                        <p className="md:text-sm text-xs truncate">
                          {t("fee_type_label", {
                            label: fee.charge_type_label,
                          })}
                        </p>
                      )}
                    </div>
                    <p className="w-full max-w-fit truncate">
                      {fee.total} {stayPrice.symbol}
                    </p>
                  </div>
                );
              })}
            {rangeBooked && (
              <div className="w-full flex flex-col text-destructive text-sm">
                <p>{t("unavailable_msg")}</p>
                <Link
                  href={`/rooms/${id}?start_date=${tripDetails.start_date}&end_date=${tripDetails.end_date}&adults=${tripDetails.adults}&children=${tripDetails.children}&infants=${tripDetails.infants}&pets=${tripDetails.pets}`}
                  className="text-sm font-semibold text-card-foreground flex flex-row gap-1 items-center"
                >
                  {t("update_stay")}
                  <ArrowUpRightFromSquareIcon className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
          <Separator />
          <div className="flex flex-row justify-between items-center w-full">
            <p className="font-semibold">{t("total")}</p>
            <p className="font-semibold">
              {stayPrice && `${stayPrice.total} ${stayPrice.symbol}`}
            </p>
          </div>
        </Card>
      )}
      {!(detailsLoading || loading) && listingInfo && stayPrice && (
        <div className="col-span-2 w-full h-full">
          <Elements stripe={stripePromise}>
            <RoomCheckoutForm
              property={{
                type: "accommodation",
                property_id: parseInt(id),
                start_date: tripDetails.start_date,
                end_date: tripDetails.end_date,
                adults: tripDetails.adults,
                children: tripDetails.children,
                infants: tripDetails.infants,
                pets: tripDetails.pets,
                name: listingInfo.listing.name,
                front_end_price: stayPrice.total,
                photo: listingInfo.photos[0].original_file || "",
                fees: stayPrice.fees,
              }}
            />
          </Elements>
        </div>
      )}
    </div>
  );
};
