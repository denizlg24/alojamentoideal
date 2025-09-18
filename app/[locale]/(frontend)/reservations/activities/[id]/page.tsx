import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  categoriesMap,
  FullExperienceType,
  PickupPlaceDto,
} from "@/utils/bokun-requests";
import { notFound } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { format } from "date-fns";
import { localeMap } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { TicketButton } from "./ticket-button";
import { Link } from "@/i18n/navigation";
import { BusFront } from "lucide-react";
import { bokunRequest } from "@/utils/bokun-server";
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

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const displayT = await getTranslations("tourDisplay");
  const t = await getTranslations("propertyCard");
  const bokunResponse = await bokunRequest<{
    activity: FullExperienceType;
    parentBookingId: number;
    answers: {
      answer: string;
      group: string;
      id: number;
      question: string;
      type: string;
    }[];
    bookedPricingCategories: {
      id: number;
      title: string;
      ticketCategory:
        | "ADULT"
        | "CHILD"
        | "TEENAGER"
        | "INFANT"
        | "SENIOR"
        | "STUDENT"
        | "MILITARY"
        | "OTHER";
      ageQualified: boolean;
      minAge?: number;
      maxAge?: number;
      fullTitle: string;
    }[];
    bookingAnswers: { questionId: string; values: string[]; label: string }[];
    pickupAnswers: { questionId: string; values: string[]; label: string }[];
    cancelNote?: string;
    cancellationDate?: string;
    cancelledBy?: string;
    confirmationCode: string;
    date: string;
    flexible: boolean;
    id: number;
    pickup: boolean;
    pickupPlace?: PickupPlaceDto;
    pickupPlaceDescription?: string;
    pickupPlaceRoomNumber?: string;
    pickupTime?: string;
    startTime?: string;
    startTimeId?: number;
    quantityByPricingCategory: { [categoryId: number]: number };
    status:
      | "CART"
      | "REQUESTED"
      | "RESERVED"
      | "CONFIRMED"
      | "TIMEOUT"
      | "ABORTED"
      | "CANCELLED"
      | "ERROR"
      | "ARRIVED"
      | "NO_SHOW"
      | "REJECTED";
    totalParticipants: number;
    totalPrice: number;
  }>({ method: "GET", path: `/booking.json/activity-booking/${id}` });
  if (!bokunResponse.success) {
    notFound();
  }
  console.log(bokunResponse);
  const uniqueIds = bokunResponse.bookedPricingCategories.reduce<
    {
      id: number;
      title: string;
      ticketCategory:
        | "ADULT"
        | "CHILD"
        | "TEENAGER"
        | "INFANT"
        | "SENIOR"
        | "STUDENT"
        | "MILITARY"
        | "OTHER";
      ageQualified: boolean;
      minAge?: number;
      maxAge?: number;
      fullTitle: string;
      count: number;
    }[]
  >(
    (prev, booked) =>
      prev.some((item) => item.id === booked.id)
        ? prev
        : [
            ...prev,
            {
              ...booked,
              count: bokunResponse.quantityByPricingCategory[booked.id],
            },
          ],
    []
  );
  const ticketResponse = await bokunRequest<{ data: string }>({
    method: "GET",
    path: `/booking.json/activity-booking/${id}/ticket`,
  });
  if (!ticketResponse.success) {
    notFound();
  }

  const invoiceResponse = await bokunRequest<{ data: string }>({
    method: "GET",
    path: `/booking.json/${bokunResponse.parentBookingId}/summary`,
  });
  if (!invoiceResponse.success) {
    notFound();
  }

  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <div className="w-full px-4 max-w-7xl mx-auto pt-12 flex flex-col gap-4">
        <h1 className="md:text-xl sm:text-lg text-base font-semibold">
          {t("confirmation-code")}: {id}
        </h1>

        <Card className="w-full flex flex-col gap-4 p-4!">
          <CardHeader className="w-full p-0">
            <div className="flex sm:flex-row flex-col items-start justify-start gap-4">
              <Image
                className="w-full sm:max-w-[20%] h-auto aspect-[2] rounded object-cover"
                width={1080}
                height={1080}
                src={bokunResponse.activity.photos[0].originalUrl}
                alt={
                  bokunResponse.activity.photos[0].caption ??
                  bokunResponse.activity.photos[0].alternateText ??
                  "No alt"
                }
              />
              <div className="flex flex-col grow gap-1 w-full">
                <div className="flex min-[420px]:flex-row flex-col min-[420px]:items-center items-start justify-between w-full">
                  {(() => {
                    switch (bokunResponse.status) {
                      case "CART":
                        return (
                          <div className="w-fit px-3 py-1.5 text-xs font-semibold rounded-sm shadow-sm bg-yellow-100 text-yellow-700">
                            {t("in-cart")}
                          </div>
                        );
                      case "REQUESTED":
                        return (
                          <div className="w-fit px-3 py-1.5 text-xs font-semibold rounded-sm shadow-sm bg-yellow-100 text-yellow-700">
                            {t("requested")}
                          </div>
                        );
                      case "RESERVED":
                        return (
                          <div className="w-fit px-3 py-1.5 text-xs font-semibold rounded-sm shadow-sm bg-yellow-100 text-yellow-700">
                            {t("reserved")}
                          </div>
                        );
                      case "CONFIRMED":
                        return (
                          <div className="w-fit px-3 py-1.5 text-xs font-semibold rounded-sm shadow-sm bg-green-100 text-green-800">
                            {t("confirmed")}
                          </div>
                        );
                      case "TIMEOUT":
                        return (
                          <div className="w-fit px-3 py-1.5 text-xs font-semibold rounded-sm shadow-sm bg-yellow-100 text-yellow-700">
                            {t("timed-out")}
                          </div>
                        );
                      case "ABORTED":
                        return (
                          <div className="w-fit px-3 py-1.5 text-xs font-semibold rounded-sm shadow-sm bg-red-100 text-red-700">
                            {t("aborted")}
                          </div>
                        );
                      case "CANCELLED":
                        return (
                          <div className="w-fit px-3 py-1.5 text-xs font-semibold rounded-sm shadow-sm bg-red-100 text-red-700">
                            {t("canceled")}
                          </div>
                        );
                      case "ERROR":
                        return (
                          <div className="w-fit px-3 py-1.5 text-xs font-semibold rounded-sm shadow-sm bg-red-100 text-red-700">
                            {t("error")}
                          </div>
                        );
                      case "ARRIVED":
                        return (
                          <div className="w-fit px-3 py-1.5 text-xs font-semibold rounded-sm shadow-sm bg-blue-100 text-blue-700">
                            {t("arrived")}
                          </div>
                        );
                      case "NO_SHOW":
                        return (
                          <div className="w-fit px-3 py-1.5 text-xs font-semibold rounded-sm shadow-sm bg-red-100 text-red-700">
                            {t("no-show")}
                          </div>
                        );
                      case "REJECTED":
                        return (
                          <div className="w-fit px-3 py-1.5 text-xs font-semibold rounded-sm shadow-sm bg-red-100 text-red-700">
                            {t("rejected")}
                          </div>
                        );
                    }
                  })()}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="px-0! w-fit! h-fit!" variant={"link"}>
                        {t("view-reservation-details")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full! max-w-[800px]!">
                      <DialogHeader>
                        <DialogTitle>
                          {bokunResponse.confirmationCode}
                        </DialogTitle>
                      </DialogHeader>

                      <Card className="p-4! rounded-none gap-1">
                        <p className="text-sm font-semibold mb-2">
                          {t("travel-doc")}
                        </p>
                        <TicketButton
                          title={`${bokunResponse.activity.title} - ${t(
                            "ticket"
                          )}`}
                          base64={ticketResponse.data}
                        />
                        <TicketButton
                          title={`${t("invoice")}`}
                          base64={invoiceResponse.data}
                        />
                      </Card>
                      {bokunResponse.pickup && bokunResponse.pickupPlace && (
                        <Card className="p-4! rounded-none gap-1">
                          <p className="text-sm font-semibold mb-2">
                            {t("pickup")}
                          </p>
                          <Button
                            className="w-fit p-0! h-fit!"
                            variant={"link"}
                            asChild
                          >
                            <Link
                              href={`https://www.google.com/maps/dir/?api=1&destination=${bokunResponse.pickupPlace.location.latitude},${bokunResponse.pickupPlace.location.longitude}`}
                            >
                              <BusFront />
                              {bokunResponse.pickupPlace.title}
                            </Link>
                          </Button>
                        </Card>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-col">
                  <h2 className="sm:text-lg text-base font-semibold">
                    {bokunResponse.activity.title}
                  </h2>
                  <h3 className="sm:text-base text-sm font-medium text-muted-foreground">
                    {bokunResponse.startTime &&
                      t("stating-at", {
                        hour: format(
                          new Date(bokunResponse.date),
                          "MMMM dd, yyyy",
                          {
                            locale: localeMap[locale as keyof typeof localeMap],
                          }
                        ),
                        time: bokunResponse.startTime,
                      })}
                    {!bokunResponse.startTime && (
                      <>
                        {format(new Date(bokunResponse.date), "MMMM dd, yyyy", {
                          locale: localeMap[locale as keyof typeof localeMap],
                        })}
                      </>
                    )}{" "}
                    /{" "}
                    {uniqueIds.map((category, indx) => {
                      return `${category.count} ${displayT(
                        categoriesMap[category.id].title
                      )}${indx < uniqueIds.length - 1 ? " " : ""}`;
                    })}
                  </h3>
                </div>
                {bokunResponse.pickup && bokunResponse.pickupPlace && (
                  <h4 className="text-sm font-semibold">
                    {t("pickup")}:{" "}
                    <span className="font-normal">
                      {bokunResponse.pickupPlace.title}
                    </span>
                  </h4>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}
