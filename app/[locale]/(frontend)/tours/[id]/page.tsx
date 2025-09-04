import {
  ActivityPlacesDto,
  FullExperienceType,
  PickupPlaceDto,
  bokunRequest,
} from "@/utils/bokun-requests";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { TourDisplay } from "./tour-display";
import { GetActivityAvailability } from "@/app/actions/getExperienceAvailability";

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
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
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
  const availability = await GetActivityAvailability(response.id.toString());
  console.log(availability);
  if (!availability) {
    notFound();
  }
  const mappedAvailability = Object.values(availability);
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <TourDisplay
        experience={response}
        meeting={meeting}
        initialAvailability={mappedAvailability}
      />
    </main>
  );
}
