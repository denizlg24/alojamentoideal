"use client";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "@/components/payment-form/checkout-form";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/hooks/cart-context";
import React, { useEffect, useMemo, useState } from "react";
import { Separator } from "../ui/separator";
import Image from "next/image";
import { format } from "date-fns";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { localeMap } from "@/lib/utils";
import { CheckoutActivityCard } from "./checkout-activity-card";
import { PickupPlaceDto } from "@/utils/bokun-requests";
import { getCheckoutData } from "@/app/actions/getExperience";
export const CheckoutHolder = ({
  cartId,
  initialCountry,
}: {
  cartId: string;
  initialCountry: string;
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

  const t = useTranslations("checkout");

  const safeLocale: StripeLocale = isValidLocale(locale) ? locale : "auto";

  const stripePromise = useMemo(
    () =>
      loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
        locale: safeLocale,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [mappedActivities, setMappedActivities] = useState<
    {
      meeting:
        | {
            type: "PICK_UP";
            pickUpPlaces: PickupPlaceDto[];
          }
        | {
            type: "MEET_ON_LOCATION";
          }
        | {
            type: "MEET_ON_LOCATION_OR_PICK_UP";
            pickUpPlaces: PickupPlaceDto[];
          };
      rateId: number;
      experienceId: number;
      selectedDate: Date;
      selectedStartTimeId: number | undefined;
      guests: { [categoryId: number]: number };
    }[]
  >([]);

  const { cart, getTotal, cartLoading } = useCart();

  useEffect(() => {
    const mapActivities = async () => {
      const mapped = (
        await getCheckoutData(cart.filter((item) => item.type == "activity"))
      ).filter((v) => v != undefined);
      setMappedActivities(mapped);
    };
    if (!cartLoading && cart.length > 0) {
      mapActivities();
    }
  }, [cart, cartLoading]);

  console.log(mappedActivities);

  return (
    <div className="lg:grid flex flex-col-reverse grid-cols-5 w-full max-w-7xl px-4 pt-12 gap-8 relative lg:items-start items-center">
      <Card className="col-span-3 flex flex-col gap-4 p-4 w-full">
        <h1 className="lg:text-2xl md:text-xl sm:text-lg text-base font-semibold">
          {t("order_summary")}
        </h1>
        <Separator />
        {cartLoading && (
          <>
            <div className="w-full flex flex-row items-start justify-between gap-2 relative">
              <Skeleton className="w-full max-w-48 h-auto aspect-video! object-cover rounded" />
              <div className="w-full grow flex flex-col truncate gap-1">
                <div className="flex flex-col w-full gap-1">
                  <Skeleton className="w-full max-w-52 h-5" />
                  <Skeleton className="w-full max-w-43 h-3" />
                </div>
                <Separator />
                <div className="flex flex-col">
                  <p className="text-xs font-semibold">{t("trip_details")}</p>
                  <Skeleton className="w-full max-w-40 h-3" />
                </div>
                <Separator />
                <div className="w-full flex flex-row gap-1 items-center">
                  <p className="text-xs flex flex-row gap-1">
                    <span className="font-semibold">{t("total")}:</span>{" "}
                  </p>
                  <Skeleton className="w-full max-w-32 h-3" />
                </div>
              </div>
            </div>
          </>
        )}

        {!cartLoading &&
          cart.map((cartItem, indx) => {
            if (cartItem.type == "accommodation") {
              return (
                <div
                  key={cartItem.property_id}
                  className="w-full flex flex-row items-start justify-between gap-2 relative"
                >
                  <Image
                    unoptimized
                    src={cartItem.photo}
                    alt="cart-logo"
                    width={1080}
                    height={1080}
                    className="w-full lg:max-w-48 md:max-w-46 sm:max-w-42 min-[420px]:max-w-36 max-w-24 h-auto aspect-video! object-cover rounded"
                  />
                  <div className="w-full grow flex flex-col truncate gap-1">
                    <div className="flex flex-col w-full gap-0">
                      <h1 className="w-full font-semibold truncate">
                        {cartItem.name}
                      </h1>
                      <h2 className="text-sm">
                        {format(new Date(cartItem.start_date), "MMM, dd", {
                          locale: localeMap[locale as keyof typeof localeMap],
                        })}{" "}
                        -{" "}
                        {format(new Date(cartItem.end_date), "MMM, dd", {
                          locale: localeMap[locale as keyof typeof localeMap],
                        })}
                      </h2>
                    </div>
                    <Separator />
                    <div className="flex flex-col">
                      <p className="text-xs font-semibold">
                        {t("trip_details")}
                      </p>
                      <p className="text-xs">
                        {t("nights", {
                          count:
                            (new Date(cartItem.end_date).getTime() -
                              new Date(cartItem.start_date).getTime()) /
                            (1000 * 60 * 60 * 24),
                          adults: cartItem.adults,
                          children:
                            cartItem.children > 0
                              ? t("child_suffix", { count: cartItem.children })
                              : "",
                          infants:
                            cartItem.infants > 0
                              ? t("infant_suffix", { count: cartItem.infants })
                              : "",
                        })}
                      </p>
                    </div>
                    <Separator />
                    <p className="text-xs">
                      <span className="font-semibold">{t("total")}:</span>{" "}
                      {cartItem.front_end_price} €
                    </p>
                  </div>
                </div>
              );
            }
            if (cartItem.type == "activity") {
              return (
                <CheckoutActivityCard
                  key={cartItem.id}
                  activityItem={cartItem}
                  index={indx}
                />
              );
            }
          })}

        {!cartLoading && (
          <div className="w-full flex flex-row items-center justify-between">
            <p className="lg:text-xl md:text-lg text-base font-semibold">
              {t("total")}:
            </p>
            <p className="lg:text-xl md:text-lg text-base font-semibold">
              {getTotal()} €
            </p>
          </div>
        )}
      </Card>
      <div className="col-span-2 w-full">
        {cart.filter((item) => item.type == "activity").length == 0 ||
        mappedActivities.length != 0 ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm
              initialCountry={initialCountry}
              cartId={cartId}
              activities={mappedActivities}
            />
          </Elements>
        ) : (
          <Skeleton className="w-full h-full min-h-[250px]" />
        )}
      </div>
    </div>
  );
};
