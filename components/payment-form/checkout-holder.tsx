"use client";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CheckoutForm } from "@/components/payment-form/checkout-form";
import { useLocale } from "next-intl";

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

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};
