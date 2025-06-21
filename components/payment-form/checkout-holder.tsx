"use client";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "@/components/payment-form/checkout-form";
import { useLocale } from "next-intl";
import { useCart } from "@/hooks/cart-context";
import React from "react";
import { Separator } from "../ui/separator";
import Image from "next/image";
import { format } from "date-fns";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
export const CheckoutHolder = () => {
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

  const { cart, getTotal, cartLoading } = useCart();

  return (
    <div className="lg:grid flex flex-col-reverse grid-cols-5 w-full max-w-7xl px-4 pt-12 gap-8 relative">
      <Card className="col-span-3 flex flex-col gap-4 p-4">
        <h1 className="lg:text-2xl md:text-xl sm:text-lg text-base font-semibold">
          Order Summary
        </h1>
        {cartLoading && (
          <>
            <Separator />
            <div className="w-full flex flex-row items-start justify-between gap-2 relative">
              <Skeleton className="w-full max-w-48 h-auto aspect-video! object-cover rounded" />
              <div className="w-full grow flex flex-col truncate gap-1">
                <div className="flex flex-col w-full gap-1">
                  <Skeleton className="w-full max-w-52 h-5" />
                  <Skeleton className="w-full max-w-43 h-3" />
                </div>
                <Separator />
                <div className="flex flex-col">
                  <p className="text-xs font-semibold">Trip details</p>
                  <Skeleton className="w-full max-w-40 h-3" />
                </div>
                <Separator />
                <div className="w-full flex flex-row gap-1 items-center">
                  <p className="text-xs flex flex-row gap-1">
                    <span className="font-semibold">Total:</span>{" "}
                  </p>
                  <Skeleton className="w-full max-w-32 h-3" />
                </div>
              </div>
            </div>
          </>
        )}
        {!cartLoading &&
          cart.map((cartItem) => {
            if (cartItem.type == "accommodation") {
              return (
                <React.Fragment key={cartItem.property_id}>
                  <Separator key={cartItem.property_id + "separator"} />
                  <div
                    key={cartItem.property_id}
                    className="w-full flex flex-row items-start justify-between gap-2 relative"
                  >
                    <Image
                      src={cartItem.photo}
                      alt="cart-logo"
                      width={1080}
                      height={1080}
                      className="w-full max-w-48 h-auto aspect-video! object-cover rounded"
                    />
                    <div className="w-full grow flex flex-col truncate gap-1">
                      <div className="flex flex-col w-full gap-0">
                        <h1 className="w-full font-semibold truncate">
                          {cartItem.name}
                        </h1>
                        <h2 className="text-sm">
                          {format(new Date(cartItem.start_date), "MMM, dd")} -{" "}
                          {format(new Date(cartItem.end_date), "MMM, dd")}
                        </h2>
                      </div>
                      <Separator />
                      <div className="flex flex-col">
                        <p className="text-xs font-semibold">Trip details</p>
                        <p className="text-xs">
                          {(new Date(cartItem.end_date).getTime() -
                            new Date(cartItem.start_date).getTime()) /
                            (1000 * 60 * 60 * 24)}{" "}
                          nights - {cartItem.adults} adults
                          {cartItem.children > 0
                            ? `, ${cartItem.children} children`
                            : ""}{" "}
                          {cartItem.infants > 0
                            ? `, ${cartItem.infants} infants`
                            : ""}
                        </p>
                      </div>
                      <Separator />
                      <p className="text-xs">
                        <span className="font-semibold">Total:</span>{" "}
                        {cartItem.front_end_price} €
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            }
          })}

        {!cartLoading && (
          <>
            <Separator />
            <div className="w-full flex flex-row items-center justify-between">
              <p className="lg:text-xl md:text-lg text-base font-semibold">
                Total:
              </p>
              <p className="lg:text-xl md:text-lg text-base font-semibold">
                {getTotal()} €
              </p>
            </div>
          </>
        )}
      </Card>
      <div className="col-span-2 w-full">
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      </div>
    </div>
  );
};
