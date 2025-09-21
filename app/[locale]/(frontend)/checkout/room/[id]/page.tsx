import { getTranslations, setRequestLocale } from "next-intl/server";
import { RoomCheckoutProvider } from "@/components/room/checkout/room-checkout-provider";
import { hostifyRequest } from "@/utils/hostify-request";
import { CalendarType } from "@/schemas/calendar.schema";
import { eachDayOfInterval, format } from "date-fns";
import { FullListingType } from "@/schemas/full-listings.schema";
import { PriceType } from "@/schemas/price.schema";
import { redirect } from "@/i18n/navigation";

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

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const verifyValidityAndLoadInfo = async ({
    tripDetails,
  }: {
    tripDetails: {
      adults: number;
      children: number;
      infants: number;
      pets: number;
      start_date: string;
      end_date: string;
    };
  }) => {
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

    const dateRange = eachDayOfInterval({
      start: new Date(tripDetails.start_date),
      end: new Date(tripDetails.end_date),
    }).map((date) => date.toISOString().split("T")[0]);

    const isRangeBooked = dateRange.some((date) =>
      calendar.calendar.some(
        (entry) =>
          entry.date === date &&
          (entry.status === "booked" || entry.status === "unavailable")
      )
    );

    const listingInfo = await hostifyRequest<FullListingType>(
      `listings/${id}`,
      "GET",
      [{ key: "include_related_objects", value: 1 }],
      undefined,
      undefined
    );
    if (isRangeBooked) {
      return { listingInfo, price: null, isRangeBooked };
    }
    const price = await hostifyRequest<{ price: PriceType }>(
      `listings/price?listing_id=${id}&start_date=${tripDetails.start_date}&end_date=${tripDetails.end_date}`,
      "GET",
      [
        { key: "guests", value: tripDetails.adults + tripDetails.children },
        { key: "include_fees", value: 1 },
        { key: "pets", value: tripDetails.pets },
      ],
      undefined,
      undefined,
      undefined
    );
    const nights =
      (new Date(tripDetails.end_date).getTime() -
        new Date(tripDetails.start_date).getTime()) /
      (1000 * 60 * 60 * 24);
    let finalPrice = 0;
    const taxPercentages: Record<number, number> = {};

    price.price.fees = price.price.fees.map((fee) => {
      if (fee.fee_type == "tax") {
        const maxQuantity = tripDetails.adults * nights;
        if (fee.quantity > maxQuantity) {
          const unitAmount = fee.total_net / fee.quantity;
          taxPercentages[fee.inclusive_percent] =
            (taxPercentages[fee.inclusive_percent] ?? 0) +
            unitAmount * maxQuantity;
          return {
            ...fee,
            quantity: maxQuantity,
            total: Number(
              (unitAmount * maxQuantity * (1 + fee.inclusive_percent)).toFixed(
                2
              )
            ),
            total_net: unitAmount * maxQuantity,
            total_tax: unitAmount * maxQuantity * fee.inclusive_percent,
          };
        }
      }
      taxPercentages[fee.inclusive_percent] =
        (taxPercentages[fee.inclusive_percent] ?? 0) + fee.total_net;
      return {
        ...fee,
        total: Number((fee.total_net * (1 + fee.inclusive_percent)).toFixed(2)),
        total_tax: fee.total_net * fee.inclusive_percent,
      };
    });
    for (const percentage of Object.keys(taxPercentages)) {
      finalPrice +=
        taxPercentages[Number(percentage)] * (1 + Number(percentage));
    }
    price.price.total = Number(finalPrice.toFixed(2));
    return { listingInfo, price, isRangeBooked };
  };

  const {
    start: start_date,
    end: end_date,
    adults: _adults,
    children: _children,
    infants: _infants,
    pets: _pets,
  } = await searchParams;

  const adults = parseInt(_adults || "0");
  const children = parseInt(_children || "0");
  const infants = parseInt(_infants || "0");
  const pets = parseInt(_pets || "0");

  if (!start_date || !end_date || !(adults > 0)) {
    redirect({ href: { pathname: `/rooms/${id}` }, locale });
    return;
  }

  const { listingInfo, price, isRangeBooked } = await verifyValidityAndLoadInfo(
    {
      tripDetails: { adults, children, infants, pets, start_date, end_date },
    }
  );

  if (!price) {
    redirect({ href: { pathname: `/rooms/${id}` }, locale });
    return;
  }
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <RoomCheckoutProvider
        listingInfo={listingInfo}
        stayPrice={price.price}
        rangeBooked={isRangeBooked}
        tripDetails={{ adults, children, infants, pets, start_date, end_date }}
        id={id}
      />
    </main>
  );
}
