import {
  ActivityPreviewResponse,
  BokunProductResponse,
  bokunRequest,
} from "@/utils/bokun-requests";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActivityPreviewCard } from "./tour-preview-card";

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

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const response = await bokunRequest<{
    items: BokunProductResponse[];
  }>({
    method: "POST",
    path: "/activity.json/search",
    body: {},
  });
  if (!response.success) {
    return (
      <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
        No tours available
      </main>
    );
  }
  const flatIds = [
    942574, 942571, 950369, 942578, 942572, 942577, 942570, 944482, 944999,
    942575, 944942, 949420, 944947, 945073,
  ];

  //const flatIds1 = response.items.map((i) => i.id);
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-4 gap-x-4 gap-y-8 sm:pt-12 pt-6">
        {flatIds.map(async (id) => {
          const experience = await bokunRequest<ActivityPreviewResponse>({
            method: "GET",
            path: `/restapi/v2.0/experience/${id}/components?componentType=MIN_AGE&componentType=PHOTOS&componentType=PRICING&componentType=PRICING_CATEGORIES&componentType=TITLE&componentType=SHORT_DESCRIPTION&componentType=LOCATION&componentType=DURATION&componentType=DIFFICULTY_LEVEL`,
          });
          if (!experience.success) {
            return;
          }
          return <ActivityPreviewCard key={id} activity={experience} />;
        })}
      </div>
    </main>
  );
}
