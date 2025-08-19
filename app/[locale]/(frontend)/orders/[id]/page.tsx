import { use } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { OrderInfoProvider } from "@/components/orders/order-info-provider";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title: t("order_details.title") || "Order Details | Alojamento Ideal",
    description:
      t("order_details.description") ||
      "Here are the details of your completed reservation, including dates, rooms, and payment status.",
    keywords: t("order_details.keywords")
      .split(",")
      .map((k) => k.trim()),
    robots: "noindex, nofollow",
    openGraph: {
      title:
        t("order_details.title") || "Your Booking Details - Alojamento Ideal",
      description:
        t("order_details.description") ||
        "View your accommodation reservation summary and payment information.",
      url: "https://alojamentoideal.com/orders/[id]",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t("order_details.title") || "Order Details - Alojamento Ideal",
      description:
        t("order_details.description") ||
        "Access your reservation confirmation and details.",
    },
  };
}

export default function Page({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const { locale, id } = use<{ locale: string; id: string }>(params);

  setRequestLocale(locale);

  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <OrderInfoProvider id={id} />
    </main>
  );
}
