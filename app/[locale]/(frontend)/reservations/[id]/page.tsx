import { getTranslations, setRequestLocale } from "next-intl/server";
import { hostifyRequest } from "@/utils/hostify-request";
import { FullListingType } from "@/schemas/full-listings.schema";
import { ReservationType } from "@/schemas/reservation.schema";
import { getOrderByReservationId } from "@/app/actions/getOrderByReference";
import { notFound } from "next/navigation";
import { syncAutomatedMessages } from "@/app/actions/syncAutomatedMessages";
import { getChatId } from "@/app/actions/getChatId";
import { PropertyInfoCard } from "@/components/orders/property-info-card";
import { AccommodationItem } from "@/hooks/cart-context";

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

const getReservationInfo = async (rId: string) => {
  const info = await hostifyRequest<{ reservation: ReservationType }>(
    `reservations/${rId}`,
    "GET",
    undefined,
    undefined,
    undefined
  );
  if (info.reservation) {
    return info.reservation;
  } else {
    return undefined;
  }
};

const getListingInfo = async (listing_id: number) => {
  const info = await hostifyRequest<FullListingType>(
    `listings/${listing_id}`,
    "GET",
    [{ key: "include_related_objects", value: 1 }],
    undefined,
    undefined
  );
  if (info.success) {
    return info;
  } else {
    return undefined;
  }
};

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("propertyCard");

  const [reservationInfo, { order }] = await Promise.all([
    getReservationInfo(id),
    getOrderByReservationId(id),
  ]);
  if (!reservationInfo) {
    notFound();
  }
  const message_id = reservationInfo.message_id;
  const info = await hostifyRequest<{
    success: boolean;
    thread: { id: string; channel_unread: number };
    messages: {
      id: number;
      target_id: number;
      message: string;
      notes: string | null;
      created: string;
      image: string | null;
      guest_name: string;
      guest_thumb: string;
      is_sms: number;
      is_automatic: number;
      pinned: number;
      avatar: string | null;
      guest_id: number;
    }[];
  }>(`inbox/${message_id}`, "GET");
  if (info.success) {
    if (reservationInfo.guest_id) {
      syncAutomatedMessages(
        reservationInfo.id.toString(),
        reservationInfo.guest_id.toString(),
        info.messages
      );
    }
  }
  const [listingInfo, chat_id] = await Promise.all([
    getListingInfo(reservationInfo.listing_id),
    getChatId(id),
  ]);

  if (!listingInfo || typeof order === "boolean") {
    notFound();
  }

  const accommodationItems: AccommodationItem[] = order.items.filter(
    (item) => item.type === "accommodation"
  ) as AccommodationItem[];
  const property = accommodationItems.find(
    (item: AccommodationItem) => item.property_id == listingInfo.listing.id
  );

  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <div className="w-full px-4 max-w-7xl mx-auto pt-12 flex flex-col gap-4">
        <h1 className="md:text-xl sm:text-lg text-base font-semibold">
          {t("confirmation-code")}: {reservationInfo.confirmation_code}
        </h1>
        <PropertyInfoCard
          property={property}
          listing={listingInfo}
          chat_id={chat_id}
          reservation={reservationInfo}
        />
      </div>
    </main>
  );
}
