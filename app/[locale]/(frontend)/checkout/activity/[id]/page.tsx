import {
  ActivityPlacesDto,
  FullExperienceType,
  PickupPlaceDto,
} from "@/utils/bokun-requests";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { GetActivityAvailability } from "@/app/actions/getExperienceAvailability";
import { CheckoutHolder } from "./checkout-holder";
import { redirect } from "@/i18n/navigation";
import { addDays, isSameDay } from "date-fns";
import { randomUUID } from "crypto";
import { bokunRequest } from "@/utils/bokun-server";

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
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { date, startTimeId, selectedRateId, guests } = await searchParams;

  if (!date || !selectedRateId || !guests) {
    redirect({ href: `/tours/${id}`, locale });
    return;
  }
  const parsedGuests: { [categoryId: number]: number } = JSON.parse(guests);
  if (!parsedGuests) {
    redirect({ href: `/tours/${id}`, locale });
    return;
  }
  const response = await bokunRequest<FullExperienceType>({
    method: "GET",
    path: `/restapi/v2.0/experience/${id}/components?componentType=ALL`,
  });
  if (!response.success) {
    notFound();
  }
  let meeting:
    | { type: "PICK_UP"; pickUpPlaces: PickupPlaceDto[] }
    | { type: "MEET_ON_LOCATION" }
    | { type: "MEET_ON_LOCATION_OR_PICK_UP"; pickUpPlaces: PickupPlaceDto[] };
  switch (response.meetingType.type) {
    case "MEET_ON_LOCATION":
      meeting = { type: "MEET_ON_LOCATION" };
      break;
    case "PICK_UP":
      const pickUpPlaces = await bokunRequest<ActivityPlacesDto>({
        method: "GET",
        path: `/activity.json/${response.id}/pickup-places`,
      });
      if (pickUpPlaces.success) {
        meeting = {
          type: "PICK_UP",
          pickUpPlaces: pickUpPlaces.pickupPlaces,
        };
        break;
      }
      meeting = {
        type: "PICK_UP",
        pickUpPlaces: [],
      };
      break;
    case "MEET_ON_LOCATION_OR_PICK_UP":
      const pickUpPlacesMeet = await bokunRequest<ActivityPlacesDto>({
        method: "GET",
        path: `/activity.json/${response.id}/pickup-places`,
      });
      if (pickUpPlacesMeet.success) {
        meeting = {
          type: "MEET_ON_LOCATION_OR_PICK_UP",
          pickUpPlaces: pickUpPlacesMeet.pickupPlaces,
        };
        break;
      }
      meeting = { type: "MEET_ON_LOCATION_OR_PICK_UP", pickUpPlaces: [] };
      break;
  }
  const availabilityResponse = await GetActivityAvailability(
    response.id.toString(),
    new Date(date),
    addDays(new Date(date), 1)
  );
  if (!availabilityResponse) {
    redirect({ href: `/tours/${id}`, locale });
    return;
  }
  const availability = Object.values(availabilityResponse).find((avail) =>
    isSameDay(avail.date, new Date(date))
  );
  if (!availability) {
    redirect({ href: `/tours/${id}`, locale });
    return;
  }
  const selectedRate = availability.rates.find(
    (rate) => rate.id.toString() == selectedRateId
  );
  if (!selectedRate) {
    redirect({ href: `/tours/${id}`, locale });
    return;
  }
  const startTime =
    startTimeId != "0"
      ? response.startTimes.find(
          (startT) => startT.id.toString() == startTimeId
        )
      : undefined;

  const totalGuests = Object.values(parsedGuests).reduce(
    (sum, val) => sum + val,
    0
  );

  if (!availability.unlimitedAvailability) {
    if (
      availability.availabilityCount == 0 ||
      (availability.availabilityCount ?? 0) < totalGuests
    ) {
      redirect({ href: `/tours/${id}`, locale });
      return;
    } else if ((availability.minParticipantsToBookNow ?? 0) > totalGuests) {
      redirect({ href: `/tours/${id}`, locale });
      return;
    }
  }

  const prices = availability.pricesByRate.find(
    (priceByRate) => priceByRate.activityRateId == selectedRate.id
  )?.pricePerCategoryUnit;

  let isPriceAvailable = true;
  let displayPrice = 0;
  for (const priceCategoryId in parsedGuests) {
    if (Object.prototype.hasOwnProperty.call(parsedGuests, priceCategoryId)) {
      const price = prices?.find(
        (price) =>
          price.id.toString() == priceCategoryId &&
          price.maxParticipantsRequired >= parsedGuests[priceCategoryId] &&
          price.minParticipantsRequired <= parsedGuests[priceCategoryId]
      );
      if (!price) {
        isPriceAvailable = false;
      } else {
        displayPrice +=
          price.amount.amount *
          (selectedRate.pricedPerPerson ?? true
            ? parsedGuests[priceCategoryId]
            : 1);
      }
    }
  }

  if (!isPriceAvailable) {
    redirect({ href: `/tours/${id}`, locale });
    return;
  }

  const cartId = randomUUID();

  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <CheckoutHolder
      cartId={cartId}
        selectedDate={new Date(date)}
        selectedRate={selectedRate}
        selectedStartTime={startTime}
        guests={parsedGuests}
        initialAvailability={availability}
        meeting={meeting}
        experience={response}
        displayPrice={displayPrice}
      />
    </main>
  );
}
