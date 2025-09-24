import { getTranslations, setRequestLocale } from "next-intl/server";
import { getOrderById } from "@/app/actions/getOrder";
import { getPaymentIntent } from "@/app/actions/getPaymentIntent";
import { notFound } from "next/navigation";
import { OrderInfo } from "@/components/orders/order-info";

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
      url: "https://alojamentoideal.pt/orders/[id]",
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

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  setRequestLocale(locale);
  const { success, order } = await getOrderById(id);
  if (success && order) {
    const payment_intent = order.payment_id
      ? await getPaymentIntent(order.payment_id)
      : undefined;
    return (
      <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
        <OrderInfo
          order={order}
          paymentIntent={payment_intent?.intent}
          charge={payment_intent?.charge}
        />
      </main>
    );
  } else {
    notFound();
  }
}
