"use client";

import { FullListingType } from "@/schemas/full-listings.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import Image from "next/image";
import { Button } from "../ui/button";
import {
  Bath,
  Bed,
  CalendarIcon,
  CircleMinus,
  CirclePlus,
  DoorOpen,
  Loader2Icon,
  NotepadText,
  Star,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  listingTypeMap,
  propertyTypeMap,
} from "@/utils/hostify-appartment-types";
import {
  ListingTranslation,
  TranslationResponse,
} from "@/schemas/translation.schema";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { Amenitie } from "../ui/amenitie";
import { ReviewCard } from "../ui/review-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { RoomInfoMap } from "./room-info-map";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { enUS, es, pt } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { format, isValid, parseISO } from "date-fns";
import { Calendar } from "../ui/calendar";
import { CalendarType } from "@/schemas/calendar.schema";
import { Label } from "../ui/label";
import { PriceType } from "@/schemas/price.schema";
import { useSearchParams } from "next/navigation";
export const RoomInfoProvider = ({ id }: { id: string }) => {
  const locale = useLocale();

  const roomInfoT = useTranslations("room-info");
  const floatingFilterT = useTranslations("floating-filter");

  const [isLoading, setLoading] = useState(true);
  const [listingInfo, setListingInfo] = useState<FullListingType | undefined>();
  const [listingTranslations, setListingTranslations] = useState<
    TranslationResponse | undefined
  >();
  const [translationsLoading, setTranslationsLoading] = useState(true);
  const [listingTranslated, setListingTranslated] = useState<
    ListingTranslation | undefined
  >();
  const [tab, setTab] = useState(0);

  const [stayPrice, updateStayPrice] = useState<PriceType | undefined>(
    undefined
  );

  const getListingInfo = async (id: string) => {
    try {
      setLoading(true);
      const info = await hostifyRequest<FullListingType>(
        `listings/${id}`,
        "GET",
        [{ key: "include_related_objects", value: 1 }],
        undefined,
        undefined
      );
      setListingInfo(info);
    } catch (error) {
      console.log(error);
      setListingInfo(undefined);
    } finally {
      setLoading(false);
    }
  };

  const getTranslations = async (id: number) => {
    try {
      setTranslationsLoading(true);
      const translations = await hostifyRequest<TranslationResponse>(
        `listings/translations/${id}`,
        "GET",
        undefined,
        undefined,
        undefined
      );
      setListingTranslations(translations);
    } catch (error) {
      console.log(error);
      setListingTranslations(undefined);
    } finally {
      setTranslationsLoading(false);
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
      updateListingCalendar(calendar.calendar);
      console.log(calendar);
    } catch (error) {
      console.log(error);
      updateListingCalendar(undefined);
    } finally {
      setLoading(false);
    }
  };

  const localeMap = {
    en: enUS,
    pt: pt,
    es: es,
  };
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const [guests, updateGuests] = useState<{
    adults: number;
    children: number;
    infants: number;
    pets: number;
  }>({ adults: 1, children: 0, infants: 0, pets: 0 });

  const searchParams = useSearchParams();

  useEffect(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const newFrom = fromParam ? parseISO(fromParam) : undefined;
    const newTo = toParam ? parseISO(toParam) : undefined;

    if (newFrom && isValid(newFrom) && newTo && isValid(newTo)) {
      setDate({
        to: newTo,
        from: newFrom,
      });
    }

    const adults = parseInt(searchParams.get("adults") || "1", 10);
    const children = parseInt(searchParams.get("children") || "0", 10);
    const infants = parseInt(searchParams.get("infants") || "0", 10);
    const pets = parseInt(searchParams.get("pets") || "0", 10);

    updateGuests({
      adults,
      children,
      infants,
      pets,
    });
  }, [searchParams]);

  const [listingCalendar, updateListingCalendar] = useState<
    CalendarType[] | undefined
  >(undefined);

  const [listingError, setListingError] = useState("");
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setListingError("");
      setListingTranslated(undefined);
      setListingTranslations(undefined);
      updateStayPrice(undefined);
      getListingInfo(id);
    }
  }, [id]);

  useEffect(() => {
    if (listingInfo) {
      getTranslations(listingInfo.listing.id);
      getCalendar(listingInfo.listing.id);
    }
  }, [listingInfo]);

  useEffect(() => {
    if (
      listingInfo &&
      listingTranslations &&
      !isLoading &&
      !translationsLoading
    ) {
      const found = listingTranslations.translation.find(
        (t) => t.language == locale
      );
      setListingTranslated(found);
    }
  }, [
    isLoading,
    listingInfo,
    listingTranslations,
    locale,
    translationsLoading,
  ]);

  const getStayPrice = async (
    from: Date,
    to: Date,
    guests: { adults: number; children: number; infants: number; pets: number }
  ) => {
    try {
      setPriceLoading(true);
      const price = await hostifyRequest<{ price: PriceType }>(
        `listings/price?listing_id=${id}&start_date=${format(
          from,
          "yyyy-MM-dd"
        )}&end_date=${format(to, "yyyy-MM-dd")}`,
        "GET",
        [
          { key: "guests", value: guests.adults + guests.children },
          { key: "include_fees", value: 1 },
          { key: "pets", value: guests.pets },
        ],
        undefined,
        undefined,
        undefined
      );
      const nights = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      let overchargeToDeduct = 0;

      price.price.fees = price.price.fees.map((fee) => {
        if (fee.fee_name.includes("City Tax")) {
          const maxQuantity = guests.adults * nights;
          if (fee.quantity > maxQuantity) {
            const excess = fee.quantity - maxQuantity;
            const unitAmount = fee.total / fee.quantity;
            const excessAmount = unitAmount * excess;
            overchargeToDeduct += excessAmount;

            return {
              ...fee,
              quantity: maxQuantity,
              total: unitAmount * maxQuantity,
              total_net: (fee.total_net / fee.quantity) * maxQuantity,
              total_tax: (fee.total_tax / fee.quantity) * maxQuantity,
            };
          }
        }
        return fee;
      });
      price.price.total -= overchargeToDeduct;
      updateStayPrice(price.price);
    } catch (error) {
      console.log(error);
      updateStayPrice(undefined);
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => {
    if (!date?.from || !date.to) {
      setListingError("");
      updateStayPrice(undefined);
      return;
    }
    if (date.from && date.to) {
      const nights =
        (date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24);
      if (nights < Math.max(listingInfo?.listing.min_nights || 2, 2)) {
        setListingError("period-not-available");
      } else {
        updateStayPrice(undefined);
        getStayPrice(date.from, date.to, guests);
      }
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, guests, listingInfo?.listing.min_nights]);

  if (isLoading || !listingInfo) {
    return (
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6 mt-6">
        <div className="md:grid hidden grid-cols-4 w-full rounded-2xl overflow-hidden gap-2">
          <div className="col-span-2 w-full h-auto aspect-[2/1.5] relative">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="col-span-1 w-full h-full flex flex-col relative gap-2">
            <Skeleton className="w-full h-auto aspect-[2/1.5]" />
            <Skeleton className="w-full h-auto aspect-[2/1.5]" />
          </div>
          <div className="col-span-1 w-full h-full flex flex-col relative gap-2">
            <Skeleton className="w-full h-auto aspect-[2/1.5]" />
            <Skeleton className="w-full h-auto aspect-[2/1.5]" />
          </div>
        </div>
        <div className="w-full md:hidden">
          <Skeleton className="w-full h-auto aspect-video rounded-2xl" />
        </div>
        <div className="w-full lg:grid grid-cols-5 flex flex-col-reverse gap-8">
          <div className="flex flex-col gap-6 col-span-3">
            <div className="w-full flex flex-col gap-1">
              <Skeleton className="w-[55%] h-6" />
              <Skeleton className="w-[45%] h-4" />
              <Skeleton className="w-24 h-4" />
            </div>
            <div className="w-full grid grid-cols-2 overflow-hidden gap-4">
              <Skeleton className="col-span-1 w-full h-6 max-w-28 mx-auto" />
              <Skeleton className="col-span-1 w-full h-6 max-w-28 mx-auto" />
              <Skeleton className="col-span-full w-full h-[1px]" />
              <div className="flex flex-row items-center justify-start w-full gap-4 flex-wrap col-span-full">
                <Skeleton className="w-full h-6 max-w-28" />
                <Skeleton className="w-full h-6 max-w-28" />
                <Skeleton className="w-full h-6 max-w-28" />
                <Skeleton className="w-full h-6 max-w-28" />
              </div>
              <div className="w-full col-span-2 flex flex-col gap-1">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-[70%] h-4" />
                <Skeleton className="w-[1px] h-4 bg-transparent" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-[70%] h-4" />
              </div>
              <Skeleton className="col-span-2 w-full h-4 mt-2" />
            </div>
          </div>
          <div className="w-full col-span-2">
            <Skeleton className="w-full aspect-[4/3] h-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl px-4 flex flex-col gap-6 mt-6">
      <div className="md:grid hidden grid-cols-4 w-full rounded-2xl overflow-hidden gap-2">
        <div className="col-span-2 w-full h-auto aspect-[2/1.5] relative">
          {listingInfo.photos[0] && (
            <Image
              src={listingInfo.photos[0].original_file}
              blurDataURL={
                listingInfo.photos[0].has_thumb
                  ? listingInfo.photos[0].thumbnail_file
                  : undefined
              }
              alt="photo 0"
              width={1920}
              height={1080}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="col-span-1 w-full h-full flex flex-col relative gap-2">
          {listingInfo.photos[1] && (
            <Image
              src={listingInfo.photos[1].original_file}
              blurDataURL={
                listingInfo.photos[1].has_thumb
                  ? listingInfo.photos[1].thumbnail_file
                  : undefined
              }
              alt="photo 1"
              width={1920}
              height={1080}
              className="w-full h-auto aspect-[2/1.5] object-cover"
            />
          )}
          {listingInfo.photos[2] && (
            <Image
              src={listingInfo.photos[2].original_file}
              blurDataURL={
                listingInfo.photos[2].has_thumb
                  ? listingInfo.photos[2].thumbnail_file
                  : undefined
              }
              alt="photo 1"
              width={1920}
              height={1080}
              className="w-full h-auto aspect-[2/1.5] object-cover"
            />
          )}
        </div>
        <div className="col-span-1 w-full h-full flex flex-col relative gap-2">
          {listingInfo.photos[3] && (
            <Image
              src={listingInfo.photos[3].original_file}
              blurDataURL={
                listingInfo.photos[3].has_thumb
                  ? listingInfo.photos[3].thumbnail_file
                  : undefined
              }
              alt="photo 1"
              width={1920}
              height={1080}
              className="w-full h-auto aspect-[2/1.5] object-cover"
            />
          )}
          {listingInfo.photos[4] && (
            <Image
              src={listingInfo.photos[4].original_file}
              blurDataURL={
                listingInfo.photos[4].has_thumb
                  ? listingInfo.photos[4].thumbnail_file
                  : undefined
              }
              alt="photo 1"
              width={1920}
              height={1080}
              className="w-full h-auto aspect-[2/1.5] object-cover"
            />
          )}
          <div className="absolute z-10 right-0 bottom-0 w-full h-auto aspect-[2/1.5] bg-foreground/50 flex flex-col justify-end items-center pb-4">
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full lg:text-sm text-xs hover:scale-[1.01] transition-transform"
                >
                  {roomInfoT("show-photos")} ({listingInfo.photos.length})
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>
                    {listingInfo.listing.name || listingInfo.listing.nickname}
                  </DrawerTitle>
                  <DrawerDescription>
                    {roomInfoT("photo-tour")}
                  </DrawerDescription>
                </DrawerHeader>
                {listingInfo.photos && (
                  <Carousel className="w-full max-w-3xl px-12 mx-auto mb-12 rounded-2xl">
                    <CarouselContent className="rounded-2xl">
                      {listingInfo.photos.map((photo, index) => (
                        <CarouselItem key={index}>
                          <Image
                            src={photo.original_file}
                            blurDataURL={
                              photo.has_thumb ? photo.thumbnail_file : undefined
                            }
                            alt={"photo-" + index}
                            width={1920}
                            height={1080}
                            className="w-full h-auto aspect-video object-cover rounded-2xl"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </Carousel>
                )}
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
      {listingInfo.photos && (
        <Carousel className="w-full md:hidden">
          <CarouselContent>
            {listingInfo.photos.map((photo, index) => (
              <CarouselItem key={index}>
                <Image
                  src={photo.original_file}
                  blurDataURL={
                    photo.has_thumb ? photo.thumbnail_file : undefined
                  }
                  alt={"photo-" + index}
                  width={1920}
                  height={1080}
                  className="w-full h-auto aspect-video object-cover rounded-2xl"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2" />
          <CarouselNext className="right-2" />
        </Carousel>
      )}

      <div className="w-full lg:grid grid-cols-5 flex flex-col-reverse gap-8">
        <div className="flex flex-col gap-6 col-span-3">
          <div className="w-full flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">
              {listingInfo.listing.name || listingInfo.listing.nickname}
            </h1>
            <h2>
              {locale == "en" ? (
                <>
                  {" "}
                  {roomInfoT(
                    listingTypeMap[listingInfo.listing.room_type]
                  )}{" "}
                  {roomInfoT(
                    propertyTypeMap[listingInfo.listing.property_type_id]
                  )}{" "}
                  {roomInfoT("propertyTypeMap.in")}{" "}
                </>
              ) : (
                <>
                  {roomInfoT(
                    propertyTypeMap[listingInfo.listing.property_type_id]
                  )}{" "}
                  {roomInfoT(listingTypeMap[listingInfo.listing.room_type])}{" "}
                  {roomInfoT("propertyTypeMap.in")}{" "}
                </>
              )}

              {listingInfo.listing.street}
            </h2>
            <div className="flex flex-row items-end justify-start gap-2">
              <p className="flex flex-row items-end gap-1 text-sm">
                <Star className="text-primary w-5 h-5" />
                {listingInfo.rating?.rating?.toFixed(2) || 0}
              </p>
              <Button
                onClick={() => {
                  setTab(1);
                }}
                variant="link"
                className="text-xs underline p-0! h-min text-foreground hover:cursor-pointer"
              >
                {listingInfo.rating?.reviews || 0} reviews
              </Button>
            </div>
          </div>
          <div className="w-full grid grid-cols-2 overflow-hidden">
            <Button
              onClick={() => {
                setTab(0);
              }}
              className="col-span-1 text-foreground hover:no-underline hover:cursor-pointer rounded-none"
              variant="link"
            >
              {roomInfoT("details")}
            </Button>
            <Button
              onClick={() => {
                setTab(1);
              }}
              className="col-span-1 text-foreground hover:no-underline hover:cursor-pointer rounded-none"
              variant="link"
            >
              {roomInfoT("reviews")}
            </Button>
            <div className="col-span-2 w-full h-[1px] bg-muted-foreground/50 grid grid-cols-2">
              <div
                className={cn(
                  "col-span-1 transition-transform w-full h-[1px] bg-primary",
                  tab == 0 ? "translate-x-0" : "translate-x-full"
                )}
              ></div>
            </div>
            <div className="col-span-2 w-full flex flex-col mt-6 gap-6">
              <AnimatePresence mode="wait">
                {tab == 0 && (
                  <motion.div
                    key="tab-0"
                    initial={{ x: "-100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "-100%", opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="col-span-full w-full flex flex-col gap-4"
                  >
                    <div className="flex flex-row items-center justify-start w-full gap-4 flex-wrap">
                      <Card className="px-2 py-1 col-span-1 flex flex-row gap-1 justify-start items-center w-fit">
                        <User className="w-5 h-5" />
                        <p>
                          {listingInfo.listing.person_capacity}{" "}
                          {listingInfo.listing.person_capacity > 1
                            ? roomInfoT("guests")
                            : roomInfoT("guest")}
                        </p>
                      </Card>
                      <Card className="px-2 py-1 col-span-1 flex flex-row gap-1 justify-start items-center w-fit">
                        <DoorOpen className="w-5 h-5" />
                        <p>
                          {listingInfo.listing.bedrooms}{" "}
                          {listingInfo.listing.bedrooms > 1
                            ? roomInfoT("bedrooms")
                            : roomInfoT("bedroom")}
                        </p>
                      </Card>
                      <Card className="px-2 py-1 col-span-1 flex flex-row gap-1 justify-start items-center w-fit">
                        <Bed className="w-5 h-5" />
                        <p>
                          {listingInfo.listing.beds}{" "}
                          {listingInfo.listing.beds > 1
                            ? roomInfoT("beds")
                            : roomInfoT("bed")}
                        </p>
                      </Card>
                      <Card className="px-2 py-1 col-span-1 flex flex-row gap-1 justify-start items-center w-fit">
                        <Bath className="w-5 h-5" />
                        <p>
                          {listingInfo.listing.bathrooms}{" "}
                          {listingInfo.listing.bathrooms > 1
                            ? roomInfoT("bathrooms")
                            : roomInfoT("bathroom")}
                        </p>
                      </Card>
                    </div>
                    <div className="w-full flex flex-col gap-1">
                      {listingTranslated?.summary?.split("\n").map((p) => {
                        return (
                          <p className="w-full text-lg" key={p}>
                            {p}
                          </p>
                        );
                      }) || <p>{roomInfoT("no-translation")}</p>}
                      {translationsLoading && (
                        <>
                          <div className="w-full flex flex-col gap-1">
                            <Skeleton className="w-full h-4" />
                            <Skeleton className="w-full h-4" />
                            <Skeleton className="w-[70%] h-4" />
                          </div>
                          <Skeleton className="w-full h-4 mt-2" />
                        </>
                      )}
                      <p className="flex flex-row items-start gap-1 text-sm mt-2">
                        <NotepadText className="w-4 h-4" />
                        <span className="font-semibold">
                          {roomInfoT("tax-permit")}:{" "}
                        </span>
                        <span className="ml-1">
                          {listingInfo.listing.permit_or_tax_id}
                        </span>
                      </p>
                    </div>
                    {(listingTranslated?.space ||
                      listingTranslated?.neighborhood_overview ||
                      listingTranslated?.house_rules ||
                      listingTranslated?.access ||
                      listingTranslated?.notes) && (
                      <Separator className="w-full" />
                    )}
                    <div className="flex flex-col gap-4 w-full">
                      {listingTranslated?.space && (
                        <>
                          <p className="text-lg font-semibold">
                            {roomInfoT("space")}
                          </p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.space.split("\n").map((s) => (
                              <p key={s + Math.random()}>{s}</p>
                            ))}
                          </div>
                        </>
                      )}
                      {listingTranslated?.interaction && (
                        <>
                          <p className="text-lg font-semibold">
                            {roomInfoT("interaction")}
                          </p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.interaction
                              .split("\n")
                              .map((s) => (
                                <p key={s + Math.random()}>{s}</p>
                              ))}
                          </div>
                        </>
                      )}

                      {listingTranslated?.neighborhood_overview && (
                        <>
                          <p className="text-lg font-semibold">
                            {roomInfoT("hood")}
                          </p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.neighborhood_overview
                              .split("\n")
                              .map((s) => (
                                <p key={s + Math.random()}>{s}</p>
                              ))}
                          </div>
                        </>
                      )}
                      {listingTranslated?.house_rules && (
                        <>
                          <p className="text-lg font-semibold">
                            {roomInfoT("house-rules")}
                          </p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.house_rules
                              .split("\n")
                              .map((s) => (
                                <p key={s + Math.random()}>{s}</p>
                              ))}
                          </div>
                        </>
                      )}
                      {listingTranslated?.house_manual && (
                        <>
                          <p className="text-lg font-semibold">
                            {roomInfoT("house-manual")}
                          </p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.house_manual
                              .split("\n")
                              .map((s) => (
                                <p key={s + Math.random()}>{s}</p>
                              ))}
                          </div>
                        </>
                      )}
                      {listingTranslated?.arrival_info && (
                        <>
                          <p className="text-lg font-semibold">
                            {roomInfoT("arrival")}
                          </p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.arrival_info
                              .split("\n")
                              .map((s) => (
                                <p key={s + Math.random()}>{s}</p>
                              ))}
                          </div>
                        </>
                      )}
                      {listingTranslated?.access && (
                        <>
                          <p className="text-lg font-semibold">
                            {roomInfoT("guest-access")}
                          </p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.access.split("\n").map((s) => (
                              <p key={s + Math.random()}>{s}</p>
                            ))}
                          </div>
                        </>
                      )}
                      {listingTranslated?.checkin_place && (
                        <>
                          <p className="text-lg font-semibold">
                            {roomInfoT("checkin-place")}
                          </p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.checkin_place
                              .split("\n")
                              .map((s) => (
                                <p key={s + Math.random()}>{s}</p>
                              ))}
                          </div>
                        </>
                      )}
                      {listingTranslated?.transit && (
                        <>
                          <p className="text-lg font-semibold">
                            {roomInfoT("transit")}
                          </p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.transit.split("\n").map((s) => (
                              <p key={s + Math.random()}>{s}</p>
                            ))}
                          </div>
                        </>
                      )}
                      {listingTranslated?.notes && (
                        <>
                          <p className="text-lg font-semibold">
                            {roomInfoT("other-things")}
                          </p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.notes.split("\n").map((s) => (
                              <p key={s + Math.random()}>{s}</p>
                            ))}
                          </div>
                        </>
                      )}
                      {(listingTranslated?.space ||
                        listingTranslated?.neighborhood_overview ||
                        listingTranslated?.house_rules ||
                        listingTranslated?.access ||
                        listingTranslated?.notes) && (
                        <Separator className="w-full" />
                      )}
                      <div className="w-full grid xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-2">
                        <p className="text-xl font-semibold mb-2 col-span-full">
                          {roomInfoT("amenities")}
                        </p>
                        {listingInfo.amenities.map((amenities) => {
                          return (
                            <Amenitie key={amenities.id} amenitie={amenities} />
                          );
                        })}
                      </div>
                      <div className="w-full flex flex-col gap-4">
                        <p className="text-xl font-semibold mb-2 col-span-full">
                          {roomInfoT("where-stay")}
                        </p>
                        <div className="w-full h-[300px] rounded-2xl overflow-hidden">
                          <RoomInfoMap
                            lat={listingInfo.listing.lat}
                            long={listingInfo.listing.lng}
                            street={listingInfo.listing.address}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {tab == 1 && (
                  <motion.div
                    key="tab-2"
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="col-span-full w-full flex flex-col gap-4"
                  >
                    {listingInfo.reviews?.length > 0 &&
                      listingInfo.reviews.slice(0, 5).map((review) => {
                        return (
                          <ReviewCard key={review.created} review={review} />
                        );
                      })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="col-span-2 w-full flex flex-col justify-start relative">
          <Card className="w-full mx-auto p-4 flex flex-col gap-2 sticky top-20">
            <Label className="w-full col-span-full sm:block hidden">
              {floatingFilterT("checkin")} - {floatingFilterT("checkout")}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "sm:flex hidden w-full col-span-2 justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd")} -{" "}
                        {format(date.to, "LLL dd")}
                      </>
                    ) : (
                      format(date.from, "LLL dd")
                    )
                  ) : (
                    <span>
                      {floatingFilterT("checkin")} -{" "}
                      {floatingFilterT("checkout")}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                className="w-auto overflow-hidden p-1 z-99 relative flex flex-col gap-0"
                align="start"
              >
                <Calendar
                  locale={localeMap[locale as keyof typeof localeMap]}
                  mode="range"
                  disabled={(date) => {
                    if (!listingCalendar) {
                      return date < new Date(new Date().toDateString());
                    }
                    const today = new Date(new Date().toDateString());

                    const dateStr = date.toISOString().split("T")[0];

                    const isBooked = listingCalendar.some(
                      (entry) =>
                        entry.status === "booked" && entry.date === dateStr
                    );

                    return date < today || isBooked;
                  }}
                  today={undefined}
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={(range) => {
                    if (range?.from && range?.to && range.to != range.from) {
                      setDate(range);
                    } else {
                      if (range?.from) {
                        setDate((prev) => {
                          return { ...prev, from: range.from };
                        });
                      } else if (range?.to) {
                        setDate((prev) => {
                          return { from: prev?.from, to: range.from };
                        });
                      }
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Label className="w-full col-span-full block sm:hidden">
              {floatingFilterT("checkin")}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "sm:hidden flex w-full col-span-2 justify-start text-left font-normal",
                    !date?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    <>{format(date.from, "LLL dd")}</>
                  ) : (
                    <span>{floatingFilterT("checkin")}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                className="w-auto overflow-hidden p-0 z-99"
                align="start"
              >
                <Calendar
                  locale={localeMap[locale as keyof typeof localeMap]}
                  mode="single"
                  disabled={(date) => {
                    if (!listingCalendar) {
                      return date < new Date(new Date().toDateString());
                    }
                    const today = new Date(new Date().toDateString());

                    const dateStr = date.toISOString().split("T")[0];

                    const isBooked = listingCalendar.some(
                      (entry) =>
                        entry.status === "booked" && entry.date === dateStr
                    );

                    return date < today || isBooked;
                  }}
                  today={undefined}
                  defaultMonth={date?.from}
                  selected={date?.from}
                  onSelect={(e) => {
                    setDate((prev) => {
                      return { from: e, to: prev?.to };
                    });
                  }}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
            <Label className="w-full col-span-full block sm:hidden">
              {floatingFilterT("checkout")}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "sm:hidden flex w-full col-span-2 justify-start text-left font-normal",
                    !date?.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.to ? (
                    <>{format(date.to, "LLL dd")}</>
                  ) : (
                    <span>{floatingFilterT("checkout")}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                className="w-auto overflow-hidden p-0 z-99"
                align="start"
              >
                <Calendar
                  locale={localeMap[locale as keyof typeof localeMap]}
                  mode="single"
                  disabled={(date) => {
                    if (!listingCalendar) {
                      return date < new Date(new Date().toDateString());
                    }
                    const today = new Date(new Date().toDateString());

                    const dateStr = date.toISOString().split("T")[0];

                    const isBooked = listingCalendar.some(
                      (entry) =>
                        entry.status === "booked" && entry.date === dateStr
                    );

                    return date < today || isBooked;
                  }}
                  today={undefined}
                  defaultMonth={date?.to}
                  selected={date?.to}
                  onSelect={(e) => {
                    setDate((prev) => {
                      return { from: prev?.from, to: e };
                    });
                  }}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
            <div className="w-full col-span-2 flex flex-row mb-2">
              <Button
                variant="link"
                className="h-min text-foreground p-0!"
                onClick={() => {
                  setDate(undefined);
                }}
              >
                <X />
                <p>{floatingFilterT("clear-dates")}</p>
              </Button>
            </div>
            <Label className="w-full col-span-full">
              {roomInfoT("guests")}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="guests"
                  variant={"outline"}
                  className="w-full col-span-2 justify-start text-left font-normal"
                >
                  <User />
                  {guests.adults + guests.children}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                className="w-[300px] overflow-hidden p-4 z-99 flex flex-col gap-3"
                align="start"
              >
                <div className="grid grid-cols-5 w-full items-center">
                  <div className="flex flex-col items-start col-span-2">
                    <p className="text-sm">{floatingFilterT("adults")}</p>
                    <p className="text-xs text-muted-foreground">
                      {floatingFilterT("ages")}{" "}
                      {listingInfo.listing.children_age_max
                        ? listingInfo.listing.children_age_max + 1
                        : "13"}
                      +
                    </p>
                  </div>
                  <div className="w-full flex flex-row justify-between items-center col-span-3">
                    <Button
                      onClick={() => {
                        updateGuests((prev) => {
                          return {
                            ...prev,
                            adults: prev.adults - 1 > 0 ? prev.adults - 1 : 1,
                          };
                        });
                      }}
                      variant="ghost"
                    >
                      <CircleMinus />
                    </Button>
                    <p className="text-sm">{guests.adults}</p>
                    <Button
                      onClick={() => {
                        updateGuests((prev) => {
                          const total = prev.adults + prev.children;
                          const capacity = listingInfo.listing.person_capacity;
                          return {
                            ...prev,
                            adults:
                              total < capacity
                                ? Math.min(
                                    prev.adults + 1,
                                    capacity - prev.children
                                  )
                                : prev.adults,
                          };
                        });
                      }}
                      variant="ghost"
                    >
                      <CirclePlus />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-5 w-full items-center">
                  <div
                    className={cn(
                      "flex flex-col items-start col-span-2",
                      listingInfo.listing.children_allowed
                        ? ""
                        : "text-muted-foreground/50!"
                    )}
                  >
                    <p className="text-sm">{floatingFilterT("children")}</p>
                    <p className="text-xs text-muted-foreground">
                      {floatingFilterT("ages")} 2-
                      {listingInfo.listing.children_age_max || "12"}
                    </p>
                  </div>
                  <div className="w-full flex flex-row justify-between items-center col-span-3">
                    <Button
                      disabled={!listingInfo.listing.children_allowed}
                      onClick={() => {
                        if (!listingInfo.listing.children_allowed) {
                          return;
                        }
                        updateGuests((prev) => {
                          return {
                            ...prev,
                            children: prev.children > 0 ? prev.children - 1 : 0,
                          };
                        });
                      }}
                      variant="ghost"
                    >
                      <CircleMinus />
                    </Button>
                    <p className="text-sm">{guests.children}</p>
                    <Button
                      disabled={!listingInfo.listing.children_allowed}
                      onClick={() => {
                        if (!listingInfo.listing.children_allowed) {
                          return;
                        }
                        updateGuests((prev) => {
                          const total = prev.adults + prev.children;
                          const capacity = listingInfo.listing.person_capacity;
                          return {
                            ...prev,
                            children:
                              total < capacity
                                ? Math.min(
                                    prev.children + 1,
                                    capacity - prev.adults,
                                    listingInfo.listing.children_count_max ||
                                      999999
                                  )
                                : prev.children,
                          };
                        });
                      }}
                      variant="ghost"
                    >
                      <CirclePlus />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-5 w-full items-center">
                  <div
                    className={cn(
                      "flex flex-col items-start col-span-2",
                      listingInfo.listing.infants_allowed
                        ? ""
                        : "text-muted-foreground/50!"
                    )}
                  >
                    <p className="text-sm">{floatingFilterT("infants")}</p>
                    <p className="text-xs text-muted-foreground">
                      {floatingFilterT("ages-under")} 2
                    </p>
                  </div>
                  <div className="w-full flex flex-row justify-between items-center col-span-3">
                    <Button
                      disabled={!listingInfo.listing.infants_allowed}
                      onClick={() => {
                        if (!listingInfo.listing.infants_allowed) {
                          return;
                        }
                        updateGuests((prev) => {
                          return {
                            ...prev,
                            infants: prev.infants > 0 ? prev.infants - 1 : 0,
                          };
                        });
                      }}
                      variant="ghost"
                    >
                      <CircleMinus />
                    </Button>
                    <p className="text-sm">{guests.infants}</p>
                    <Button
                      disabled={!listingInfo.listing.infants_allowed}
                      onClick={() => {
                        if (!listingInfo.listing.infants_allowed) {
                          return;
                        }
                        updateGuests((prev) => {
                          return {
                            ...prev,
                            infants:
                              prev.infants + 1 <
                              listingInfo.listing.person_capacity * 2
                                ? prev.infants + 1
                                : listingInfo.listing.person_capacity * 2,
                          };
                        });
                      }}
                      variant="ghost"
                    >
                      <CirclePlus />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-5 w-full items-center">
                  <div
                    className={cn(
                      "flex flex-row items-center justify-start gap-1 col-span-2",
                      listingInfo.listing.pets_allowed
                        ? ""
                        : "text-muted-foreground/50!"
                    )}
                  >
                    <p className="text-sm">{floatingFilterT("pets")}</p>
                  </div>
                  <div className="w-full flex flex-row justify-between items-center col-span-3">
                    <Button
                      disabled={!listingInfo.listing.pets_allowed}
                      onClick={() => {
                        if (!listingInfo.listing.pets_allowed) {
                          return;
                        }
                        updateGuests((prev) => {
                          return {
                            ...prev,
                            pets: prev.pets > 0 ? prev.pets - 1 : 0,
                          };
                        });
                      }}
                      variant="ghost"
                    >
                      <CircleMinus />
                    </Button>
                    <p className="text-sm">{guests.pets}</p>
                    <Button
                      disabled={!listingInfo.listing.pets_allowed}
                      onClick={() => {
                        if (!listingInfo.listing.pets_allowed) {
                          return;
                        }
                        updateGuests((prev) => {
                          return {
                            ...prev,
                            pets: prev.pets + 1 < 21 ? prev.pets + 1 : 20,
                          };
                        });
                      }}
                      variant="ghost"
                    >
                      <CirclePlus />
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {listingError && (
              <div className="w-full col-span-2 flex flex-row items-center justify-center">
                <p className="text-destructive text-sm">{listingError}</p>
              </div>
            )}
            {(priceLoading || stayPrice) && (
              <div className="w-full col-span-full flex flex-col">
                {priceLoading && (
                  <Skeleton className="w-full h-[200px] flex flex-row items-center justify-center">
                    <Loader2Icon className="animate-spin" />
                  </Skeleton>
                )}
                {!priceLoading && stayPrice && (
                  <div className="w-full flex flex-col gap-4">
                    <div className="w-full flex flex-col gap-2">
                      {stayPrice.fees.map((fee) => {
                        return (
                          <div
                            key={fee.fee_id}
                            className="w-full flex flex-row gap-2 items-center justify-between"
                          >
                            <div className="flex flex-row items-center justify-start gap-1 truncate w-full">
                              <p className="md:text-base text-sm">
                                {fee.fee_name}
                              </p>
                              {fee.charge_type_label && (
                                <p className="md:text-sm text-xs truncate">
                                  - {fee.charge_type_label}
                                </p>
                              )}
                            </div>
                            <p className="w-full max-w-fit truncate">
                              {fee.total} {stayPrice.symbol}
                            </p>
                          </div>
                        );
                      })}
                      <Separator />
                      <div className="w-full flex flex-row items-center justify-between">
                        <p className="md:text-base text-sm">
                          {roomInfoT("total")}
                        </p>
                        <p>
                          {stayPrice.total} {stayPrice.symbol}
                        </p>
                      </div>
                    </div>
                    <Button>{roomInfoT("payment")}</Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
