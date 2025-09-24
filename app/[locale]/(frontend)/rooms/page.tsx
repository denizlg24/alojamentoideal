import { getTranslations, setRequestLocale } from "next-intl/server";
import { RoomListingHolder } from "./room-listings-holder";
import { Suspense } from "react";
import { ListingsSkeleton } from "./loading";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title: t("rooms.title") || "Available Rooms | Alojamento Ideal",
    description:
      t("rooms.description") ||
      "Browse all available rooms and find the perfect stay for your next trip.",
    keywords: t("rooms.keywords")
      .split(",")
      .map((k) => k.trim()),
    robots: "index, follow",
    openGraph: {
      title: t("rooms.title") || "Find Your Stay - Alojamento Ideal",
      description:
        t("rooms.description") ||
        "Compare rooms, see features, and book directly from our platform.",
      url: "https://alojamentoideal.pt/rooms",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("rooms.title") || "Rooms Listing - Alojamento Ideal",
      description:
        t("rooms.description") ||
        "Explore available rooms and book your next stay with ease.",
    },
  };
}

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const keyString = `filters=${JSON.stringify(
    await searchParams
  )}+${Math.random()}`;
  return (
    <Suspense key={keyString} fallback={<ListingsSkeleton />}>
      <RoomListingHolder searchParams={searchParams} />
    </Suspense>
  );
}
