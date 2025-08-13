import { RoomInfoProvider } from "@/components/room/room-info-provider";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title: t("room_detail.title") || "Room Details | Alojamento Ideal",
    description:
      t("room_detail.description") ||
      "Explore this room's features, amenities, photos, and pricing before booking.",
    keywords: t("room_detail.keywords")
      .split(",")
      .map((k) => k.trim()),
    robots: "index, follow",
    openGraph: {
      title: t("room_detail.title") || "Room Information - Alojamento Ideal",
      description:
        t("room_detail.description") ||
        "See photos, features, and prices for this accommodation.",
      url: "https://alojamentoideal.com/rooms/[id]",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: t("room_detail.title") || "Room Details - Alojamento Ideal",
      description:
        t("room_detail.description") ||
        "Preview this room before booking your stay.",
    },
  };
}

export default function Home({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const { locale, id } = use<{ locale: string; id: string }>(params);

  setRequestLocale(locale);

  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <RoomInfoProvider id={id} />
    </main>
  );
}
