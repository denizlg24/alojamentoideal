import { use } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutHolder } from "@/components/payment-form/checkout-holder";
import { randomUUID } from "crypto";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title:
      t("checkout.title") ||
      "Checkout - Confirm Your Booking | Alojamento Ideal",
    description:
      t("checkout.description") ||
      "Review and confirm your selected accommodations before completing your reservation.",
    keywords: t("room_detail.keywords")
      .split(",")
      .map((k) => k.trim()),
    robots: "index, follow",
    openGraph: {
      title: t("checkout.title") || "Checkout - Alojamento Ideal",
      description:
        t("checkout.description") ||
        "Finalize your accommodation booking securely and quickly.",
      url: "https://alojamentoideal.com/checkout",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("checkout.title") || "Checkout - Alojamento Ideal",
      description:
        t("checkout.description") ||
        "Securely confirm your accommodation selection before completing your purchase.",
    },
  };
}

export default function Page({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const { locale } = use<{ locale: string }>(params);

  setRequestLocale(locale);
  const cartId = randomUUID();
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <CheckoutHolder cartId={cartId}/>
    </main>
  );
}
