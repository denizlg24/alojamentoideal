import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ActivityBookingQuestionsDto,
  categoriesMap,
  FullExperienceType,
  PickupPlaceDto,
  QuestionSpecificationDto,
} from "@/utils/bokun-requests";
import { notFound } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { differenceInHours, format, subMinutes } from "date-fns";
import { localeMap } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { TicketButton } from "./ticket-button";
import { bokunRequest } from "@/utils/bokun-server";
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  PlusCircle,
  RefreshCwIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomInfoMap } from "@/components/room/room-info-map";
import { PickupPlaceCard } from "./pickup-place-card";
import { CompleteBookingQuestion } from "./booking-questions-complete-card";
import { Separator } from "@/components/ui/separator";
import { CancelBookingDialog } from "./cancel-booking-dialog";
export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title: t("activity_reservation_details.title"),
    description: t("activity_reservation_details.description"),
    keywords: t("activity_reservation_details.keywords")
      .split(",")
      .map((k) => k.trim()),
    robots: "noindex, nofollow",
    openGraph: {
      title: t("activity_reservation_details.title"),
      description: t("activity_reservation_details.description"),
      url: "https://alojamentoideal.pt/reservations/[id]",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t("activity_reservation_details.title"),
      description: t("activity_reservation_details.description"),
    },
  };
}

function formatTenMinutesBefore(hour: number, minute: number) {
  // Create a Date with today's date, and set hour/minute
  const base = new Date();
  base.setHours(hour, minute, 0, 0);

  // Subtract 10 minutes
  const result = subMinutes(base, 10);

  // Format however you like, e.g. "HH:mm"
  return format(result, "HH:mm");
}

function getRefundPercentage(activityDate: Date, currentDate: Date): number {
  const diffMs = activityDate.getTime() - currentDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours >= 48) {
    return 100; // Full refund
  } else if (diffHours >= 24) {
    return 50; // Half refund
  } else {
    return 0; // No refund
  }
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
    activity: Omit<FullExperienceType, "meetingType"> & {
      meetingType:
        | "MEET_ON_LOCATION"
        | "PICK_UP"
        | "MEET_ON_LOCATION_OR_PICK_UP";
      startPoints: {
        labels?: string[];
        address: { geoPoint: { latitude: number; longitude: number } };
        title: string;
        id: number;
      }[];
    };
    bookingId: number;
    parentBookingId: number;
    answers: {
      answer: string;
      group: string;
      id: number;
      question: string;
      type: string;
    }[];
    productConfirmationCode:string;
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
    cancellationPolicy?: {
      id: number;
      title: string;
      penaltyRules: {
        id: number;
        cutoffHours: number;
        charge: number;
        chargeType: "percentage" | "amount";
        percentage: number;
      }[];
    };
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
  const bookingQuestions = await bokunRequest<{
    mainContactDetails: QuestionSpecificationDto[];
    activityBookings: ActivityBookingQuestionsDto[];
  }>({
    method: "GET",
    path: `/question.json/booking/${bokunResponse.parentBookingId}`,
  });

  const hasEmptyAnswer =
    bookingQuestions.success &&
    (bookingQuestions.activityBookings
      .find((activity) => activity.bookingId === bokunResponse.bookingId)
      ?.questions?.some(
        (question) =>
          (question.answers ?? []).length === 0 ||
          question.answers?.[0]?.trim?.() === ""
      ) ||
      bookingQuestions.activityBookings
        .find((activity) => activity.bookingId === bokunResponse.bookingId)
        ?.passengers.some((passenger) =>
          passenger.questions.some(
            (question) =>
              (question.answers ?? []).length === 0 ||
              question.answers?.[0]?.trim?.() === ""
          )
        ) ||
      bookingQuestions.activityBookings
        .find((activity) => activity.bookingId === bokunResponse.bookingId)
        ?.passengers.some((passenger) =>
          passenger.passengerDetails.some(
            (question) =>
              (question.answers ?? []).length === 0 ||
              question.answers?.[0]?.trim?.() === ""
          )
        ) ||
      bookingQuestions.activityBookings
        .find((activity) => activity.bookingId === bokunResponse.bookingId)
        ?.pickupQuestions?.some(
          (question) =>
            (question.answers ?? []).length === 0 ||
            question.answers?.[0]?.trim?.() === ""
        ));

  const refundPercentage = getRefundPercentage(
    new Date(bokunResponse.date),
    new Date()
  );
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <div className="w-full px-4 max-w-7xl mx-auto pt-12 flex flex-col gap-4">
        <h1 className="md:text-xl sm:text-lg text-base font-semibold">
          {t("confirmation-code")}: {id}
        </h1>
        {hasEmptyAnswer && (
          <div className="w-full p-2 shadow border rounded-sm bg-muted flex flex-col gap-2">
            <div className="flex min-[420px]:flex-row flex-col items-center justify-between">
              <div className="flex flex-row items-center gap-2 justify-start">
                <h1 className="sm:text-sm text-xs font-semibold">
                  {t("information-missing")}
                </h1>
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                  disabled={bokunResponse.status != "CONFIRMED" && bokunResponse.status != "ARRIVED" && bokunResponse.status != "RESERVED"}
                    className="h-fit p-0! sm:text-sm text-xs"
                    variant={"link"}
                  >
                    {t("complete-questions")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[800px]! w-[95%]!">
                  <DialogHeader className="gap-0">
                    <DialogTitle className="sm:text-base text-sm">
                      {t("complete-questions")}
                    </DialogTitle>
                    <DialogDescription className="sm:text-sm text-xs">
                      {t("complete-for-better-exp")}
                    </DialogDescription>
                  </DialogHeader>
                  <CompleteBookingQuestion
                    mainContactDetails={bookingQuestions.mainContactDetails}
                    individualId={bokunResponse.bookingId}
                    activityBookingId={bokunResponse.parentBookingId}
                    activityBookings={bookingQuestions.activityBookings}
                    initialBookingQuestions={
                      bookingQuestions.activityBookings.find(
                        (activity) =>
                          activity.bookingId == bokunResponse.bookingId
                      )?.questions
                    }
                    initialPassengers={
                      bookingQuestions.activityBookings.find(
                        (activity) =>
                          activity.bookingId == bokunResponse.bookingId
                      )?.passengers
                    }
                    initialPickupQuestions={
                      bookingQuestions.activityBookings.find(
                        (activity) =>
                          activity.bookingId == bokunResponse.bookingId
                      )?.pickupQuestions
                    }
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
        {!hasEmptyAnswer && bookingQuestions.success && (
          <div className="w-full p-2 shadow border rounded-sm bg-muted flex flex-col gap-2">
            <div className="flex min-[420px]:flex-row flex-col items-center justify-between">
              <div className="flex flex-row items-center gap-2 justify-start">
                <h1 className="sm:text-sm text-xs font-semibold">
                  {t("information-complete")}
                </h1>
                <CheckCircle className="w-3.5 h-3.5 shrink-0 text-green-600" />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                  disabled={bokunResponse.status != "CONFIRMED" && bokunResponse.status != "ARRIVED" && bokunResponse.status != "RESERVED"}
                    className="h-fit p-0! sm:text-sm text-xs"
                    variant={"link"}
                  >
                    {t("edit-questions")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[800px]! w-[95%]!">
                  <DialogHeader className="gap-0">
                    <DialogTitle className="sm:text-base text-sm">
                      {t("update-questions")}
                    </DialogTitle>
                    <DialogDescription className="sm:text-sm text-xs">
                      {t("update-for-better-exp")}
                    </DialogDescription>
                  </DialogHeader>
                  <CompleteBookingQuestion
                    mainContactDetails={bookingQuestions.mainContactDetails}
                    individualId={bokunResponse.bookingId}
                    activityBookingId={bokunResponse.parentBookingId}
                    activityBookings={bookingQuestions.activityBookings}
                    initialBookingQuestions={
                      bookingQuestions.activityBookings.find(
                        (activity) =>
                          activity.bookingId == bokunResponse.bookingId
                      )?.questions
                    }
                    initialPassengers={
                      bookingQuestions.activityBookings.find(
                        (activity) =>
                          activity.bookingId == bokunResponse.bookingId
                      )?.passengers
                    }
                    initialPickupQuestions={
                      bookingQuestions.activityBookings.find(
                        (activity) =>
                          activity.bookingId == bokunResponse.bookingId
                      )?.pickupQuestions
                    }
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
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
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-col">
                  <h2 className="sm:text-lg text-base font-semibold">
                    {bokunResponse.activity.title}
                    {bokunResponse.activity.startTimes.find(
                      (startTime) => startTime.id == bokunResponse.startTimeId
                    )?.externalLabel
                      ? ` - ${
                          bokunResponse.activity.startTimes.find(
                            (startTime) =>
                              startTime.id == bokunResponse.startTimeId
                          )?.externalLabel
                        }`
                      : ""}
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

                {bookingQuestions.success &&
                  bookingQuestions.activityBookings.find(
                    (activity) => activity.bookingId == bokunResponse.bookingId
                  )?.pickupQuestions?.length &&
                  bokunResponse.pickup && (
                    <h4 className="text-sm font-semibold">
                      {t("pickup")}:
                      {bokunResponse.pickupPlace ? (
                        <span className="font-normal">
                          {" "}
                          {bokunResponse.pickupPlace.title}
                        </span>
                      ) : bookingQuestions.activityBookings.find(
                          (activity) =>
                            activity.bookingId == bokunResponse.bookingId
                        )?.pickupQuestions![0].answers &&
                        bookingQuestions.activityBookings.find(
                          (activity) =>
                            activity.bookingId == bokunResponse.bookingId
                        )?.pickupQuestions![0].answers[0] != "" ? (
                        <span className="font-normal">
                          {" "}
                          {
                            bookingQuestions.activityBookings.find(
                              (activity) =>
                                activity.bookingId == bokunResponse.bookingId
                            )?.pickupQuestions![0].answers[0]
                          }
                        </span>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <span className="font-normal inline-flex flex-row items-center justify-start gap-1 ml-1 hover:border-b hover:cursor-pointer">
                              {t("add-pickup")}
                              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                            </span>
                          </DialogTrigger>
                          <DialogContent></DialogContent>
                        </Dialog>
                      )}
                    </h4>
                  )}
                {bokunResponse.activity.meetingType == "MEET_ON_LOCATION" && (
                  <h4 className="text-sm font-semibold">
                    {t("meet-up-point")}{" "}
                    <a
                      href={`https://www.google.com/maps/place/${bokunResponse.activity.startPoints[0].address.geoPoint.latitude},${bokunResponse.activity.startPoints[0].address.geoPoint.longitude}`}
                      className="font-normal inline-flex items-center gap-1"
                      target="_blank"
                    >
                      {bokunResponse.activity.startPoints
                        ? bokunResponse.activity.startPoints[0].title
                        : "No meetup specified."}
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </h4>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
        {bokunResponse.activity.meetingType != "MEET_ON_LOCATION" &&
          bokunResponse.pickup &&
          bookingQuestions.success && (
            <PickupPlaceCard
              initialPickup={bokunResponse.pickupPlace}
              initialPickupQuestions={
                bookingQuestions.activityBookings.find(
                  (activity) => activity.bookingId == bokunResponse.bookingId
                )?.pickupQuestions
              }
            />
          )}
        {bokunResponse.activity.meetingType == "MEET_ON_LOCATION" &&
          bokunResponse.activity.startPoints && (
            <Card className="w-full flex flex-col gap-4 p-4!">
              <div className="w-full flex flex-col gap-1">
                <h1 className="sm:text-base text-sm font-bold">
                  {t("meet-on-location")}
                </h1>
                {bokunResponse.activity.bookingType == "DATE_AND_TIME" && (
                  <p className="sm:text-sm text-xs font-bold text-left">
                    {t("arrive-by", {
                      time:
                        formatTenMinutesBefore(
                          bokunResponse.activity.startTimes.find(
                            (startTime) =>
                              startTime.id == bokunResponse.startTimeId
                          )!.hour,
                          bokunResponse.activity.startTimes.find(
                            (startTime) =>
                              startTime.id == bokunResponse.startTimeId
                          )!.minute
                        ) ?? "",
                    })}
                    .
                  </p>
                )}
                <h2 className="sm:text-sm text-xs">
                  {t("meet-on-one-of-points")}
                </h2>
              </div>
              <Tabs
                defaultValue={bokunResponse.activity.startPoints[0].id.toString()}
              >
                <TabsList>
                  {bokunResponse.activity.startPoints.map((startPoint) => {
                    return (
                      <TabsTrigger
                        value={startPoint.id.toString()}
                        key={startPoint.id}
                      >
                        {startPoint.title}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {bokunResponse.activity.startPoints.map((startPoint) => {
                  return (
                    <TabsContent
                      className="w-full flex flex-col gap-2"
                      value={startPoint.id.toString()}
                      key={startPoint.id + "-content"}
                    >
                      <div className="w-full h-[250px] rounded-lg overflow-hidden shadow">
                        <RoomInfoMap
                          lat={startPoint.address.geoPoint.latitude}
                          long={startPoint.address.geoPoint.longitude}
                          street={startPoint.title}
                        />
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </Card>
          )}
        {(bokunResponse.status == "CONFIRMED" || bokunResponse.status == "ARRIVED") && bokunResponse.cancellationPolicy && (
          <Card className="w-full flex flex-col gap-4 p-4!">
            <div className="w-full flex flex-col gap-1">
              <h1 className="sm:text-base text-sm font-bold">
                {t("cancellation-and-refunds")}
              </h1>
            </div>
            <div className="w-full flex flex-col gap-2">
              {bokunResponse.cancellationPolicy.penaltyRules.length == 0 && (
                <>
                  <p className="inline-flex gap-1 w-full items-center justify-start sm:text-base text-sm">
                    <RefreshCwIcon className="text-blue-500 w-4 h-4 shrink-0" />
                    {t("refund-not-available")}
                  </p>
                  <Separator className="mb-1" />
                  <CancelBookingDialog refundPercentage={0} productConfirmationCode={bokunResponse.productConfirmationCode} total_price={bokunResponse.totalPrice}/>
                  <p className="text-muted-foreground text-sm -mt-1">
                    {t("cancellation-available")}
                  </p>
                </>
              )}
              {bokunResponse.cancellationPolicy.penaltyRules.length > 0 && (
                <>
                  <p className="inline-flex gap-1 w-full items-center justify-start sm:text-base text-sm">
                    <RefreshCwIcon className="text-blue-500 w-4 h-4 shrink-0" />
                    {t("standard-refund-title")}
                  </p>
                  <ul className="list-decimal list-inside pl-2 marker:text-muted-foreground/50 sm:text-sm text-xs flex flex-col items-start gap-2">
                    <li> {t("standard-refund-p1")}</li>
                    <li> {t("standard-refund-p2")}</li>
                    <li> {t("standard-refund-p3")}</li>
                  </ul>
                  <Separator className="mb-1" />
                 <CancelBookingDialog refundPercentage={refundPercentage} productConfirmationCode={bokunResponse.productConfirmationCode} total_price={bokunResponse.totalPrice}/>
                  <p className="text-muted-foreground text-sm -mt-1">
                    {refundPercentage > 0 ? t("cancellation-desc", {
                      hours: differenceInHours(
                        new Date(bokunResponse.date),
                        new Date()
                      ),
                      refund: refundPercentage,
                    }) : t("not-refundable-anymore",{hours:t("less-than-24")})}
                  </p>
                </>
              )}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
