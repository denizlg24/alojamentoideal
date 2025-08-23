import { use } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ReservationInfoProvider } from "@/components/reservations/reservation-info-provider";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title: t("reservation_details.title"),
    description: t("reservation_details.description"),
    keywords: t("reservation_details.keywords")
      .split(",")
      .map((k) => k.trim()),
    robots: "noindex, nofollow",
    openGraph: {
      title: t("reservation_details.title"),
      description: t("reservation_details.description"),
      url: "https://alojamentoideal.com/reservations/[id]",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t("reservation_details.title"),
      description: t("reservation_details.description"),
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
      <ReservationInfoProvider reservation_id={id} />
    </main>
  );
}
