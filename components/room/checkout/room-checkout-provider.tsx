"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { FullListingType } from "@/schemas/full-listings.schema";
import { PriceType } from "@/schemas/price.schema";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { format } from "date-fns";
import { ArrowUpRightFromSquareIcon, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { RoomCheckoutForm } from "./room-checkout-form";
import { useTranslations } from "next-intl";
import { localeMap } from "@/lib/utils";

export const RoomCheckoutProvider = ({
  id,
  listingInfo,
  tripDetails,
  rangeBooked,
  stayPrice,
}: {
  id: string;
  listingInfo: FullListingType;
  tripDetails: {
    adults: number;
    children: number;
    infants: number;
    pets: number;
    start_date: string;
    end_date: string;
  };
  rangeBooked: boolean;
  stayPrice: PriceType;
}) => {
  const locale = useLocale();

  const t = useTranslations("checkout");
  const feeT = useTranslations("feeTranslations");
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

  return (
    <div className="md:grid flex flex-col-reverse grid-cols-4 w-full max-w-7xl px-4 pt-12 gap-8 relative md:items-stretch items-center">
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
                    <p className="md:text-base text-sm">
                      {fee.fee_name?.startsWith("City Tax")
                        ? `${feeT("City Tax")}${fee.fee_name.slice(
                            "City Tax".length
                          )}`
                        : feeT(fee.fee_name || "not-found")}
                    </p>
                    {fee.fee_charge_type && (
                      <p className="md:text-sm text-xs truncate">
                        - {fee.amount}€ / {feeT(fee.fee_charge_type)}
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
    </div>
  );
};
