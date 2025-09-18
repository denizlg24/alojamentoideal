"use client";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FullExperienceType,
  PickupPlaceDto,
  ExperienceAvailabilityDto,
  ExperienceStartTimeDto,
  ExperienceRateDto,
} from "@/utils/bokun-requests";
import { format, subHours } from "date-fns";
import { BusFront, ClockIcon, RotateCcw, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { TourCheckoutForm } from "./checkout-form";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { localeMap } from "@/lib/utils";

function formatCancellationPolicy(
  policy: ExperienceRateDto["cancellationPolicy"],
  experienceDate: Date
): string[] {
  const rules = [...policy.penaltyRules].sort(
    (a, b) => a.cutoffHours - b.cutoffHours
  );
  const result: string[] = [];
  // Only use the smallest cutoff as the real date reference
  const mainCutoff = rules[0].cutoffHours;
  const cutoffDate = subHours(experienceDate, mainCutoff);
  const formattedDate = format(cutoffDate, "MMM d, yyyy");

  // Build phrases
  const firstRule = rules[0];
  if (firstRule.percentage === 100) {
    result.push(`Cancel after ${formattedDate}: no refund.`);
  } else if (firstRule.percentage === 0) {
    result.push(`Cancel after ${formattedDate}: full refund.`);
  } else {
    result.push(
      `Cancel after ${formattedDate}: ${100 - firstRule.percentage}% refund.`
    );
  }

  const lastRule = rules[rules.length - 1];
  if (lastRule.percentage === 0) {
    result.push(`Cancel before ${formattedDate} for a full refund.`);
  } else if (lastRule.percentage === 100) {
    result.push(`Cancel before ${formattedDate}: no refund.`);
  } else {
    result.push(
      `Cancel before ${formattedDate}: ${100 - lastRule.percentage}% refund.`
    );
  }

  return result;
}

export const CheckoutHolder = ({
  cartId,
  experience,
  selectedDate,
  selectedRate,
  meeting,
  initialAvailability,
  selectedStartTime,
  guests,
  displayPrice,
}: {
  cartId:string,
  displayPrice: number;
  selectedDate: Date;
  selectedStartTime: ExperienceStartTimeDto | undefined;
  selectedRate: ExperienceRateDto;
  guests: { [categoryId: number]: number };
  experience: FullExperienceType;
  meeting:
    | { type: "PICK_UP"; pickUpPlaces: PickupPlaceDto[] }
    | { type: "MEET_ON_LOCATION" }
    | { type: "MEET_ON_LOCATION_OR_PICK_UP"; pickUpPlaces: PickupPlaceDto[] };
  initialAvailability: ExperienceAvailabilityDto;
}) => {
  const locale = useLocale();
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
  const displayT = useTranslations("tourDisplay");
  return (
    <div className="lg:grid flex flex-col-reverse grid-cols-5 w-full max-w-7xl px-4 pt-12 gap-8 relative lg:items-start items-center">
      <Card className="col-span-3 flex flex-col gap-4 p-4 w-full">
        <Image unoptimized 
          src={experience.photos[0].originalUrl}
          alt={experience.photos[0].caption ?? "thumbnail photo"}
          width={1920}
          height={1080}
          className="w-full aspect-[2] h-auto max-h-[250px] object-cover rounded-2xl"
        />
        <div className="flex flex-col gap-0">
          <h1 className="font-semibold">{selectedRate.title}</h1>
          <h2 className="text-sm line-clamp-3">{selectedRate.description}</h2>
        </div>
        <Separator />
        <div className="w-full flex flex-col gap-0">
          <p className="sm:text-base text-sm font-semibold">
            {displayT("experience-details")}
          </p>
          <div className="flex flex-row items-center justify-start text-left gap-1">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <p className="text-sm">
              {Object.values(guests).reduce((acc, curr) => acc + curr, 0)}{" "}
              {displayT("passengers")}
            </p>
          </div>
          <div className="flex flex-row items-center justify-start gap-1">
            <ClockIcon className="w-3.5 h-3.5 shrink-0" />
            {selectedStartTime ? (
              <h2 className="text-sm">
                {format(selectedDate, "MMMM dd, yyyy", {
                  locale: localeMap[locale as keyof typeof localeMap],
                })}
                , {displayT("starting-at")}{" "}
                {format(
                  new Date(
                    selectedDate.setHours(selectedStartTime.hour)
                  ).setMinutes(selectedStartTime.minute),
                  "HH:mm a",
                  { locale: localeMap[locale as keyof typeof localeMap] }
                )}
              </h2>
            ) : (
              <h2 className="text-sm">
                {format(selectedDate, "MMMM dd, yyyy")},{" "}
                {displayT("flexible-start-time")}
              </h2>
            )}
          </div>
          <Separator className="my-4" />
          <div className="flex flex-col justify-start text-left text-xs font-semibold w-full">
            {experience.meetingType.type != "MEET_ON_LOCATION" && (
              <div className="flex flex-row items-center justify-start gap-1">
                <BusFront className="w-3 h-3 shrink-0" />
                <p>
                  {displayT("pickup-available")}{" "}
                  {selectedRate.pickupPricingType == "INCLUDED_IN_PRICE" &&
                    displayT("pickup-included")}
                </p>
              </div>
            )}
            {experience?.privateExperience && (
              <div className="flex flex-row items-center justify-start gap-1">
                <Users className="w-3 h-3 shrink-0" />
                <p className="text-xs text-left">
                  {displayT("private-experience-desc")}
                </p>
              </div>
            )}
            {!experience?.privateExperience && (
              <div className="flex flex-row items-center justify-start gap-1">
                <Users className="w-3 h-3 shrink-0" />
                <p className="text-xs text-left">
                  {initialAvailability.bookedParticipants}/
                  {initialAvailability.availabilityCount +
                    initialAvailability.bookedParticipants}
                  {initialAvailability.bookedParticipants >= 0
                    ? `${displayT("booked-people", {
                        count: initialAvailability.bookedParticipants,
                      })}`
                    : ""}
                </p>
              </div>
            )}
          </div>
          <Separator className="my-4" />
          <p className="sm:text-base text-sm font-semibold flex flex-row items-center gap-1 justify-start text-left">
            <RotateCcw className="text-blue-400 w-4 h-4 shrink-0" />
            {displayT("cancellation-policy")}
          </p>

          <ul className="list-disc marker:text-gray-400 pl-5 text-xs">
            {selectedRate.cancellationPolicy &&
            selectedRate.cancellationPolicy.policyType != "NON_REFUNDABLE" ? (
              formatCancellationPolicy(
                selectedRate.cancellationPolicy,
                selectedDate
              ).map((policy) => {
                return (
                  <li className="" key={policy}>
                    {policy}
                  </li>
                );
              })
            ) : (
              <li className="">{displayT("experience-not-refundable")}</li>
            )}
          </ul>
          <Separator className="my-4" />
          <div className="flex flex-row justify-between gap-1 w-full">
            <p className="sm:text-base text-sm font-semibold">
              {displayT("total")}
            </p>
            <p className="text-sm">{displayPrice}€</p>
          </div>
        </div>
      </Card>
      <Card className="col-span-2 w-full p-4">
        <Elements stripe={stripePromise}>
          <TourCheckoutForm
          cartId={cartId}
            bookingQuestions={experience.bookingQuestions}
            mainPaxInfo={experience.mainPaxInfo}
            otherPaxInfo={experience.otherPaxInfo}
            guests={guests}
            rateId={selectedRate.id}
            selectedStartTimeId={selectedStartTime?.id}
            selectedDate={selectedDate}
            experienceId={experience.id}
            meeting={meeting}
          />
        </Elements>
      </Card>
    </div>
  );
};
