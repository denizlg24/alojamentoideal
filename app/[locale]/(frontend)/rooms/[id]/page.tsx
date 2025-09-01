import { RoomInfoProvider } from "@/components/room/room-info-provider";
import { CalendarType } from "@/schemas/calendar.schema";
import { FullListingType } from "@/schemas/full-listings.schema";
import { TranslationResponse } from "@/schemas/translation.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { format } from "date-fns";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

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

const getListingInfo = async (id: string) => {
  try {
    const info = await hostifyRequest<FullListingType>(
      `listings/${id}`,
      "GET",
      [{ key: "include_related_objects", value: 1 }],
      undefined,
      undefined
    );
    return { listing: info };
  } catch {
    return { listing: undefined };
  }
};

const getHostifyTranslations = async (id: number) => {
  try {
    const translations = await hostifyRequest<TranslationResponse>(
      `listings/translations/${id}`,
      "GET",
      undefined,
      undefined,
      undefined
    );
    return { translations };
  } catch {
    return { translations: undefined };
  }
};

const getCalendar = async (id: number) => {
  try {
    const calendar = await hostifyRequest<{ calendar: CalendarType[] }>(
      `calendar?listing_id=${id}&start_date=${format(
        new Date(),
        "yyyy-MM-dd"
      )}`,
      "GET",
      undefined,
      undefined,
      undefined,
      { page: 1, perPage: 365 }
    );
    return { calendar: calendar.calendar };
  } catch {
    return { calendar: undefined };
  }
};

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (!id) {
    notFound();
  }
  const { listing } = await getListingInfo(id);
  if (!listing || listing.listing.is_listed == 0) {
    notFound();
  }
  const [{ translations }, { calendar }] = await Promise.all([
    getHostifyTranslations(listing.listing.id),
    getCalendar(listing.listing.id),
  ]);
  if (!translations || !calendar) {
    notFound();
  }
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <RoomInfoProvider
        listingInfo={listing}
        listingTranslations={translations}
        listingCalendar={calendar}
        id={id}
      />
    </main>
  );
}
