import { format, parse } from "date-fns";
import { Separator } from "../ui/separator";
import {
  Check,
  ChevronDownIcon,
  Edit,
  Info,
  Loader2Icon,
  MapPinned,
  MessageCircle,
  PlusCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FullListingType } from "@/schemas/full-listings.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { ReservationType } from "@/schemas/reservation.schema";
import {
  buildCancellationMessage,
  cn,
  formatSecondsToHHMM,
  formatTime,
  isTimeBetweenAndValid,
  isTimeUpTo,
  localeMap,
  parseTimeToSeconds,
} from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { RoomInfoMap } from "../room/room-info-map";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { OrderChat } from "./order-chat";
import { callHostkitAPI } from "@/app/actions/callHostkitApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CountrySelect } from "./country-select";
import { Calendar } from "../ui/calendar";
import { Guest } from "@/models/GuestData";
import { getGuestData } from "@/app/actions/getGuestData";
import { Card } from "../ui/card";
import { Form, FormControl, FormField, FormItem } from "../ui/form";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateGuestData } from "@/app/actions/updateGuestData";

export const PropertyInfoCard = ({
  listing,
  reservation,
  setReservation,
  refreshMessages,
  chat_id,
}: {
  listing: FullListingType;
  reservation: ReservationType;
  setReservation: Dispatch<SetStateAction<ReservationType | undefined>>;
  refreshMessages: () => void;
  chat_id: string;
}) => {
  const locale = useLocale();

  const cancellationT = useTranslations("cancellation");
  const t = useTranslations("propertyCard");

  const addGuestSchema = z.object({
    first_name: z.string().min(2, { message: "" }),
    last_name: z.string().min(2, { message: "" }),
    birthday: z.string().min(2, { message: "" }),
    document_type: z.enum(["P", "ID", "O"]),
    document_country: z.string(),
    document_number: z.string().min(2, { message: "" }),
    nationality: z.string(),
    country_residence: z.string(),
    city_residence: z.string().min(2, { message: "" }),
  });
  const addGuestForm = useForm<z.infer<typeof addGuestSchema>>({
    resolver: zodResolver(addGuestSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      birthday: "",
      document_type: "P",
      document_country: "PRT",
      document_number: "",
      nationality: "PRT",
      country_residence: "PRT",
      city_residence: "",
    },
  });

  const [arrivalLoading, setArrivalLoading] = useState(false);
  const [departureLoading, setDepartureLoading] = useState(false);

  const [guestInfoCustomDoneField, setGuestInfoDone] = useState<
    "done" | "pending" | false
  >(false);

  const [plannedArrival, setPlannedArrival] = useState(
    reservation.planned_arrival ?? ""
  );
  const [plannedDeparture, setPlannedDeparture] = useState(
    reservation.planned_departure ?? ""
  );
  const [arrivingError, setArrivingError] = useState("");
  const [leavingError, setLeavingError] = useState("");

  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);

  const [guest_data, setGuestData] = useState<Guest[]>([]);

  useEffect(() => {
    const getCheckInDone = async () => {
      const data = await callHostkitAPI<{
        short_link: string;
        status?: "done";
      }>({
        listingId: listing.listing.id.toString(),
        endpoint: "getOnlineCheckin",
        query: { rcode: reservation.confirmation_code },
      });
      const data2 = await getGuestData(
        reservation.confirmation_code,
        listing.listing.id.toString()
      );
      if (data2) {
        setGuestData(data2.guest_data);
        if (data2.guest_data.length == reservation.guests) {
          if (data) {
            if (data.status === "done") {
              setGuestInfoDone("done");
            } else {
              setGuestInfoDone("pending");
            }
          }
        } else {
          setGuestInfoDone(false);
        }
      }
    };
    if (listing.listing && reservation.confirmation_code) getCheckInDone();
  }, [listing.listing, reservation]);

  useEffect(() => {
    if (!listing?.listing) {
      return;
    }

    const timeOut = setTimeout(() => {
      if (
        plannedArrival &&
        !isTimeBetweenAndValid(
          plannedArrival,
          listing?.listing.checkin_start,
          listing?.listing.checkin_end
        )
      ) {
        setArrivingError("invalid_time");
      } else {
        setArrivingError("");
      }
    }, 300);

    return () => {
      clearTimeout(timeOut);
    };
  }, [listing?.listing, plannedArrival]);

  useEffect(() => {
    if (!listing?.listing) {
      return;
    }
    const timeOut = setTimeout(() => {
      if (
        plannedDeparture &&
        !isTimeUpTo(plannedDeparture, listing?.listing.checkout)
      ) {
        setLeavingError("invalid_time");
      } else {
        setLeavingError("");
      }
    }, 300);

    return () => {
      clearTimeout(timeOut);
    };
  }, [listing?.listing, plannedDeparture]);

  async function onSubmitAddGuest(values: z.infer<typeof addGuestSchema>) {
    setAddingGuest(true);
    const addedGuest = await updateGuestData({
      booking_code: reservation.confirmation_code,
      guest_data: [
        ...guest_data,
        {
          ...values,
          arrival: reservation.checkIn,
          departure: reservation.checkOut,
        },
      ],
    });
    if (addedGuest) {
      setGuestData(addedGuest.guest_data);
    }
    setAddGuestOpen(false);
    setAddingGuest(false);
  }

  const isMobile = useIsMobile();

  const getReservationStatus = (
    reservation: ReservationType | undefined,
    guestInfoCustomDoneField: "done" | "pending" | false | undefined
  ) => {
    if (!reservation) {
      return (
        <div className="w-full flex flex-row items-center gap-2">
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
          <Skeleton className="w-[80%] max-w-[200px] h-5" />
        </div>
      );
    }
    if (reservation.status == "accepted") {
      if (!guestInfoCustomDoneField) {
        return (
          <div className="w-full flex flex-row items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
            <p className="text-xs font-semibold">
              {t("waiting-for-guest-data")}
            </p>
            {isMobile ? (
              <Popover>
                <PopoverTrigger>
                  <Info className="w-4! h-4!" />
                </PopoverTrigger>
                <PopoverContent className="w-full max-w-[300px] text-xs">
                  {t("guest_info_required")}
                </PopoverContent>
              </Popover>
            ) : (
              <HoverCard>
                <HoverCardTrigger>
                  <Info className="w-4! h-4!" />
                </HoverCardTrigger>
                <HoverCardContent className="w-full max-w-[300px] text-xs">
                  {t("guest_info_required")}
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
        );
      }
      if (guestInfoCustomDoneField == "pending") {
        return (
          <div className="w-full flex flex-row items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
            <p className="text-xs font-semibold">{t("verifying-guest-data")}</p>
            {isMobile ? (
              <Popover>
                <PopoverTrigger>
                  <Info className="w-4! h-4!" />
                </PopoverTrigger>
                <PopoverContent className="w-full max-w-[300px] text-xs">
                  {t("validating-desct")}
                </PopoverContent>
              </Popover>
            ) : (
              <HoverCard>
                <HoverCardTrigger>
                  <Info className="w-4! h-4!" />
                </HoverCardTrigger>
                <HoverCardContent className="w-full max-w-[300px] text-xs">
                  {t("guest_info_required")}
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
        );
      }
      return (
        <div className="w-full flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-green-600"></div>
          <p className="text-xs font-semibold">{t("order-confirmed")}</p>
        </div>
      );
    }
    if (reservation.status == "pending") {
      return (
        <div className="w-full flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
          <p className="text-xs font-semibold">{t("reservation-pending")}</p>
        </div>
      );
    }
    if (reservation.status == "awaiting_payment") {
      return (
        <div className="w-full flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
          <p className="text-xs font-semibold">
            {t("reservation-waiting-payment")}
          </p>
        </div>
      );
    }

    if (
      reservation.status == "cancelled" ||
      reservation.status == "denied" ||
      reservation.status == "deleted"
    ) {
      return (
        <div className="w-full flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-600"></div>
          <p className="text-xs font-semibold">
            {t("reservation-canceled")}{" "}
            <span className="font-medium">
              ({reservation.status_description})
            </span>
          </p>
        </div>
      );
    }
    return <></>;
  };

  return (
    <div className="w-full flex flex-col gap-3 relative">
      <div className="grid sm:grid-cols-2 grid-cols-1 gap-x-8">
        {listing?.photos && (
          <Carousel className="w-full">
            <CarouselContent>
              {listing?.photos.map((photo, index) => (
                <CarouselItem key={index}>
                  <Image
                    src={photo.original_file}
                    blurDataURL={
                      photo.has_thumb ? photo.thumbnail_file : undefined
                    }
                    alt={"photo-" + index}
                    width={1920}
                    height={1080}
                    className="w-full sm:h-auto h-full sm:max-h-full max-h-[250px] sm:aspect-video object-cover rounded-2xl"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        )}
        <div className="w-full sm:h-full h-[250px] sm:mt-0 mt-4 overflow-hidden rounded-lg shadow">
          <RoomInfoMap
            lat={listing.listing.lat}
            long={listing.listing.lng}
            street={listing.listing.street}
          />
        </div>
        <div className="flex flex-col w-full gap-0 sm:mt-8 mt-4">
          <h1 className="w-full lg:text-2xl md:text-xl sm:text-lg text-base font-semibold truncate">
            {listing.listing.name}
          </h1>
          <p className="w-full md:text-base text-xs font-medium truncate text-muted-foreground">
            {listing.listing.street}
          </p>
          {getReservationStatus(reservation, guestInfoCustomDoneField)}
        </div>
        <div className="w-full max-w-full p-1 px-3 bg-muted rounded-lg shadow grid grid-cols-2 relative h-fit! sm:mt-8 mt-4">
          <div className="col-span-1 flex flex-col">
            <p className="md:text-base text-sm font-medium">{t("arriving")}</p>
            <p className="md:text-base text-sm font-normal">
              {format(new Date(reservation?.checkIn), "EEE, MMM dd", {
                locale: localeMap[locale as keyof typeof localeMap],
              })}
            </p>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 h-[60%] w-[0.5px] bg-muted-foreground/50 top-1/2 -translate-y-1/2"></div>
          <div className="col-span-1 flex flex-col text-right">
            <p className="md:text-base text-sm font-medium">{t("leaving")}</p>
            <p className="md:text-base text-sm font-normal">
              {format(new Date(reservation?.checkOut), "EEE, MMM dd", {
                locale: localeMap[locale as keyof typeof localeMap],
              })}
            </p>
          </div>
        </div>
        <Separator className="col-span-full my-4" />
        <div className="col-span-full w-full">
          <p className="lg:text-xl md:text-lg text-base font-semibold">
            {t("trip_details")}
          </p>
        </div>

        <div className="w-full flex flex-col gap-1 mt-4">
          <p className="md:text-base text-sm font-semibold">
            {t("confirmation-code")}{" "}
          </p>
          <p className="md:text-base sm:text-sm text-xs">
            {reservation.confirmation_code}
          </p>
        </div>
        <div className="w-full flex flex-col gap-1 mt-4">
          <p className="md:text-base text-sm font-semibold">
            {t("cancellation-policy")}
          </p>
          <p className="md:text-base sm:text-sm text-xs">
            {buildCancellationMessage({
              bookingAt: new Date(reservation.confirmed_at),
              checkInAt: new Date(reservation.checkIn),
              locale,
              t: cancellationT,
            })}
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <p className="md:text-base sm:text-sm text-xs underline font-medium hover:cursor-pointer">
                {cancellationT("read-more")}
              </p>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("cancellation-policy")}</DialogTitle>
                <DialogDescription className="hidden">
                  {t("cancellation-policy")}
                </DialogDescription>
              </DialogHeader>
              <p className="md:text-base sm:text-sm text-xs">
                {cancellationT("p1")}
              </p>
              <p className="md:text-base sm:text-sm text-xs">
                {cancellationT("p2")}
              </p>
              <p className="md:text-base sm:text-sm text-xs">
                {cancellationT("p3")}
              </p>
            </DialogContent>
          </Dialog>
        </div>
        <div className="w-full flex flex-col gap-1 mt-4 col-span-full">
          <p className="md:text-base text-sm font-semibold">
            {t("whos-coming")}
          </p>
          <p className="md:text-sm text-xs text-muted-foreground mb-2">
            {t("add_guest_info_desc")}
          </p>
          <div className="w-full flex flex-row items-center gap-2 flex-wrap justify-start">
            {guest_data.map((guest) => {
              return (
                <Card
                  key={guest.document_number}
                  className="md:w-32! h-auto! bg-muted w-24! aspect-square! rounded-full! shadow! flex-col items-center text-center justify-center gap-0"
                >
                  <p className="font-bold text-sm truncate w-[90%]">
                    {guest.first_name} {guest.last_name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {guest.document_number}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {format(new Date(guest.birthday), "dd MMM yyyy", {
                      locale: localeMap[locale as keyof typeof localeMap],
                    })}
                  </p>
                </Card>
              );
            })}
            {guest_data.length < reservation.guests && (
              <Dialog
                onOpenChange={(e) => {
                  if (!e) {
                    addGuestForm.reset();
                  }
                  setAddGuestOpen(e);
                }}
                open={addGuestOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    disabled={reservation.status != "accepted"}
                    variant={"secondary"}
                    className={cn(
                      "md:w-32! h-auto! w-24! aspect-square! rounded-full! shadow! flex-col-reverse",
                      reservation.status != "accepted" &&
                        "hover:cursor-not-allowed"
                    )}
                  >
                    {t("add")}
                    <PlusCircle />
                  </Button>
                </DialogTrigger>
                <DialogContent className="flex flex-col gap-0! w-[calc(100vw-16px)]! mx-auto max-w-[800px]!">
                  <DialogTitle className="text-base hidden">
                    {t("add_guest_info")}
                  </DialogTitle>
                  <DialogDescription className="text-sm mt-0! hidden">
                    {t("add_guest_info_desc")}
                  </DialogDescription>
                  <Form {...addGuestForm}>
                    <form
                      onSubmit={addGuestForm.handleSubmit(onSubmitAddGuest)}
                      className="w-full flex flex-col gap-2 mt-4"
                    >
                      <div className="flex flex-col gap-2 w-full">
                        <div className="-mt-1 sm:grid flex flex-col grid-cols-3 w-full gap-1">
                          <div className="flex flex-col gap-0 col-span-1">
                            <p className="text-sm">{t("first-name")}</p>
                            <FormField
                              control={addGuestForm.control}
                              name="first_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder={t("first_name_placeholder")}
                                      className="grow"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex flex-col gap-0 col-span-1">
                            <p className="text-sm">{t("last-name")}</p>
                            <FormField
                              control={addGuestForm.control}
                              name="last_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder={t("last_name_placeholder")}
                                      className="grow"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex flex-col gap-0 col-span-1">
                            <p className="text-sm">{t("birthdate")}</p>

                            <FormField
                              control={addGuestForm.control}
                              name="birthday"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          id="date"
                                          className="w-full justify-between font-normal"
                                        >
                                          {field.value == ""
                                            ? t("select-date")
                                            : field.value}
                                          <ChevronDownIcon />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        className="w-auto overflow-hidden p-0 z-99"
                                        align="start"
                                      >
                                        <Calendar
                                          mode="single"
                                          locale={
                                            localeMap[
                                              locale as keyof typeof localeMap
                                            ]
                                          }
                                          captionLayout="dropdown"
                                          {...field}
                                          selected={
                                            field.value
                                              ? parse(
                                                  field.value,
                                                  "yyyy-MM-dd",
                                                  new Date()
                                                )
                                              : undefined
                                          }
                                          onSelect={(date) => {
                                            if (date) {
                                              field.onChange(
                                                format(date, "yyyy-MM-dd")
                                              );
                                            } else {
                                              field.onChange("");
                                            }
                                          }}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap flex-row items-center justify-start gap-1 -mt-1">
                          <div className="flex flex-col gap-0 shrink-0 w-fit!">
                            <p className="text-sm">{t("document")}</p>

                            <FormField
                              control={addGuestForm.control}
                              name="document_type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select
                                      {...field}
                                      value={field.value}
                                      onValueChange={(v) => {
                                        field.onChange(v);
                                      }}
                                      defaultValue="P"
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue
                                          placeholder={t("passport")}
                                        />
                                      </SelectTrigger>
                                      <SelectContent className="z-99 w-full">
                                        <SelectItem value="P">
                                          {t("passport")}
                                        </SelectItem>
                                        <SelectItem value="ID">
                                          {t("id")}
                                        </SelectItem>
                                        <SelectItem value="O">
                                          {t("other")}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex flex-col gap-0 shrink-0 w-fit!">
                            <p className="text-sm">{t("document_country")}</p>

                            <FormField
                              control={addGuestForm.control}
                              name="document_country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <CountrySelect
                                      {...field}
                                      value={field.value}
                                      onChange={(v) => {
                                        field.onChange(v);
                                      }}
                                      defaultValue="PRT"
                                      locale={locale}
                                      className="z-99 w-full"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex flex-col gap-0 grow w-fit!">
                            <p className="text-sm">{t("document_number")}</p>

                            <FormField
                              control={addGuestForm.control}
                              name="document_number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder={t("doc_id_placeholder")}
                                      className="grow"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap flex-row items-center justify-start gap-1 -mt-1">
                          <div className="flex flex-col gap-0 shrink-0 w-fit!">
                            <p className="text-sm">{t("nationality")}</p>

                            <FormField
                              control={addGuestForm.control}
                              name="nationality"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <CountrySelect
                                      {...field}
                                      defaultValue="PRT"
                                      locale={locale}
                                      className="z-99 w-full"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex flex-col gap-0 shrink-0 w-fit!">
                            <p className="text-sm">{t("residence")}</p>
                            <FormField
                              control={addGuestForm.control}
                              name="country_residence"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <CountrySelect
                                      {...field}
                                      defaultValue="PRT"
                                      locale={locale}
                                      className="z-99 w-full"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex flex-col gap-0 grow">
                            <p className="text-sm">{t("residence-city")}</p>
                            <FormField
                              control={addGuestForm.control}
                              name="city_residence"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder={t("city_placeholder")}
                                      className="grow"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <Button disabled={addingGuest} type="submit">
                          {addingGuest ? (
                            <>
                              <Loader2Icon className="animate-spin" />{" "}
                              {t("add-guest-information")}
                            </>
                          ) : (
                            <>{t("add-guest-information")}</>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        <Separator className="col-span-full my-4" />

        <div className="w-full col-span-full grid sm:grid-cols-2 grid-cols-1 gap-4 items-stretch">
          <div className="col-span-full flex flex-col gap-0">
            <p className="col-span-full lg:text-lg md:text-base text-sm font-semibold">
              {t("coordinate-with-host")}{" "}
            </p>
            <p className="col-span-full md:text-base text-xs text-muted-foreground">
              {t(
                "please-provide-this-information-to-help-coordinate-with-the-host"
              )}{" "}
            </p>
          </div>

          <div className="col-span-1 w-full h-full flex flex-col gap-1">
            <p className="text-sm">
              {t("checkin", {
                start: formatTime(listing.listing.checkin_start, locale),
              })}
            </p>
            <div className="w-full flex flex-row gap-1 items-center mt-auto">
              <p className="text-sm">{t("planed-checkin")}</p>
              <Input
                value={plannedArrival}
                onChange={(e) => {
                  setPlannedArrival(e.target.value);
                }}
                placeholder="15:00"
                name="check-in"
                className="grow max-w-24 p-1! px-2! h-fit"
              />
              <Button
                onClick={async () => {
                  if (
                    !isTimeBetweenAndValid(
                      plannedArrival,
                      listing.listing.checkin_start,
                      listing.listing.checkin_end
                    )
                  ) {
                    return;
                  }
                  const time = formatSecondsToHHMM(
                    parseTimeToSeconds(plannedArrival) || 0
                  );
                  if (time) {
                    setArrivalLoading(true);

                    hostifyRequest<{ success: boolean }>(
                      `reservations/${reservation.id}`,
                      "PUT",
                      undefined,
                      {
                        planned_arrival: `${time}:00`,
                      },
                      undefined,
                      undefined
                    );
                    await new Promise((resolve) => setTimeout(resolve, 300));
                    setPlannedArrival(`${time}:00`);
                    reservation.planned_arrival = setReservation((prev) => {
                      if (prev) {
                        return { ...prev, planned_arrival: `${time}:00` };
                      }
                      return prev;
                    });
                    setArrivalLoading(false);
                  }
                }}
                disabled={
                  arrivalLoading ||
                  !plannedArrival ||
                  plannedArrival == reservation.planned_arrival ||
                  arrivingError
                    ? true
                    : false
                }
                className="w-6 h-6 hover:cursor-pointer rounded-full"
              >
                {arrivalLoading ? (
                  <Loader2Icon className="animate-spin" />
                ) : !reservation.planned_arrival ? (
                  <Check />
                ) : (
                  <Edit />
                )}
              </Button>
            </div>
            {arrivingError && (
              <p className="text-xs font-semibold text-destructive">
                {t(arrivingError)}
              </p>
            )}
          </div>

          <div className="col-span-1 w-full h-full flex flex-col gap-1">
            <p className="text-sm">
              {listing.listing.checkout
                ? t("checkout", {
                    time: formatTime(listing.listing.checkout, locale),
                  })
                : t("checkout_anytime")}
            </p>
            <div className="w-full flex flex-row gap-1 items-center mt-auto">
              <p className="text-sm">{t("planed-checkout")}</p>
              <Input
                value={plannedDeparture}
                onChange={(e) => {
                  setPlannedDeparture(e.target.value);
                }}
                placeholder="21:00"
                name="check-out"
                className="grow max-w-24 p-1! px-2! h-fit"
              />
              <Button
                onClick={async () => {
                  if (
                    !isTimeUpTo(plannedDeparture, listing?.listing.checkout)
                  ) {
                    return;
                  }
                  const time = formatSecondsToHHMM(
                    parseTimeToSeconds(plannedDeparture) || 0
                  );
                  if (time) {
                    setDepartureLoading(true);
                    hostifyRequest<{ success: boolean }>(
                      `reservations/${reservation.id}`,
                      "PUT",
                      undefined,
                      {
                        planned_departure: `${time}:00`,
                      },
                      undefined,
                      undefined
                    );
                    await new Promise((resolve) => setTimeout(resolve, 300));
                    setPlannedDeparture(`${time}:00`);
                    setReservation((prev) => {
                      if (prev) {
                        return { ...prev, planned_departure: `${time}:00` };
                      }
                      return prev;
                    });
                    setDepartureLoading(false);
                  }
                }}
                disabled={
                  departureLoading ||
                  !plannedDeparture ||
                  plannedDeparture == reservation.planned_departure ||
                  leavingError
                    ? true
                    : false
                }
                className="w-6 h-6 hover:cursor-pointer rounded-full"
              >
                {departureLoading ? (
                  <Loader2Icon className="animate-spin" />
                ) : !reservation.planned_departure ? (
                  <Check />
                ) : (
                  <Edit />
                )}
              </Button>
            </div>
            {leavingError && (
              <p className="text-xs font-semibold text-destructive">
                {t(leavingError)}
              </p>
            )}
          </div>
        </div>
        <Separator className="col-span-full my-4" />
        <div className="grid sm:grid-cols-2 grid-cols-1 gap-x-8 gap-4 col-span-full w-full">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                disabled={reservation?.status != "accepted"}
                className="grow"
              >
                <MapPinned />
                {t("get_directions")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{listing.listing.name}</DialogTitle>
                <DialogDescription className="hidden">
                  Get directions to your place
                </DialogDescription>
              </DialogHeader>
              <div className="w-full aspect-video h-auto overflow-hidden rounded shadow">
                <RoomInfoMap
                  lat={listing.listing.lat}
                  long={listing.listing.lng}
                  street={listing.listing.street}
                />
              </div>
              <Button asChild>
                <Link
                  href={`https://www.google.com/maps/place/${encodeURI(
                    listing.listing.address
                  )}`}
                  target="_blank"
                >
                  <MapPinned />
                  {t("get_directions")}
                </Link>
              </Button>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="grow relative" variant={"outline"}>
                <MessageCircle />
                {t("contact_host")}
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0! bg-transparent! border-none! outline-0! text-white">
              <DialogHeader className="hidden">
                <DialogTitle>Chat</DialogTitle>
                <DialogDescription>Chat</DialogDescription>
              </DialogHeader>
              <OrderChat refreshMessages={refreshMessages} chat_id={chat_id} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};
