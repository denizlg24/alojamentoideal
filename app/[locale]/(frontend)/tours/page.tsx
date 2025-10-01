import {
  ActivityPreviewResponse,
  BokunProductResponse,
} from "@/utils/bokun-requests";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActivityPreviewCard } from "./tour-preview-card";
import Image from "next/image";
import toursBanner from "@/public/porto-banner.jpeg";
import { bokunRequest } from "@/utils/bokun-server";
export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title: t("activities.title") || "Order Details | Alojamento Ideal",
    description:
      t("activities.description") ||
      "Here are the details of your completed reservation, including dates, rooms, and payment status.",
    keywords: t("activities.keywords")
      .split(",")
      .map((k) => k.trim()),
    robots: "noindex, nofollow",
    openGraph: {
      title: t("activities.title") || "Your Booking Details - Alojamento Ideal",
      description:
        t("activities.description") ||
        "View your accommodation reservation summary and payment information.",
      url: "https://alojamentoideal.pt/orders/[id]",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t("activities.title") || "Order Details - Alojamento Ideal",
      description:
        t("activities.description") ||
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
  const t = await getTranslations("header");
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
        {t("no-tours-available")}
      </main>
    );
  }
  /*const flatIds = [
    942574, 942571, 950369, 942578, 942572, 942577, 942570, 944482, 944999,
    942575, 944942, 949420, 944947, 945073,
  ];*/

  //const flatIds1 = response.items.map((i) => i.id);

  const flatIds = [1094683,1094996];

  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <div className="w-full relative">
        <Image
          unoptimized
          alt="tours-banner"
          src={toursBanner}
          className="w-full sm:h-[250px] h-[200px] object-cover"
        />
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 font-bold lg:text-6xl md:text-5xl sm:text-5xl min-[420px]:text-4xl text-3xl text-background shadow">
          {t("tours")}
        </h1>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 grid md:grid-cols-4 sm:grid-cols-3 min-[420px]:grid-cols-2 grid-cols-1 gap-x-4 gap-y-8 sm:pt-12 pt-6">
        <h2 className="lg:text-lg sm:text-base text-sm font-semibold text-left col-span-full">
          {t("tours-desc")}
        </h2>
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
