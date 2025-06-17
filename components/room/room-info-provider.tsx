"use client";

import { FullListingType } from "@/schemas/full-listings.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import Image from "next/image";
import { Button } from "../ui/button";
import { Bath, Bed, DoorOpen, NotepadText, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { propertyTypeMap } from "@/utils/hostify-appartment-types";
import {
  ListingTranslation,
  TranslationResponse,
} from "@/schemas/translation.schema";
import { useLocale } from "next-intl";
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
export const RoomInfoProvider = ({ id }: { id: string }) => {
  const locale = useLocale();
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

  useEffect(() => {
    if (id) {
      getListingInfo(id);
    }
  }, [id]);

  useEffect(() => {
    if (listingInfo) {
      getTranslations(listingInfo.listing.id);
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
                  Show all photos ({listingInfo.photos.length})
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>
                    {listingInfo.listing.name || listingInfo.listing.nickname}
                  </DrawerTitle>
                  <DrawerDescription>Photo tour</DrawerDescription>
                </DrawerHeader>
                {listingInfo.photos && (
                  <Carousel className="w-full max-w-3xl mx-auto mb-12 rounded-2xl">
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
              {propertyTypeMap[listingInfo.listing.property_type_id]} in{" "}
              {listingInfo.listing.street}
            </h2>
            <div className="flex flex-row items-end justify-start gap-2">
              <p className="flex flex-row items-end gap-1 text-sm">
                <Star className="text-primary w-5 h-5" />
                {listingInfo.rating?.rating?.toFixed(2) || 0}
              </p>
              <Button
                onClick={() => {
                  setTab(2);
                }}
                variant="link"
                className="text-xs underline p-0! h-min text-foreground"
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
              Property Details
            </Button>
            <Button
              onClick={() => {
                setTab(1);
              }}
              className="col-span-1 text-foreground hover:no-underline hover:cursor-pointer rounded-none"
              variant="link"
            >
              Reviews
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
                            ? "Guests"
                            : "Guest"}
                        </p>
                      </Card>
                      <Card className="px-2 py-1 col-span-1 flex flex-row gap-1 justify-start items-center w-fit">
                        <DoorOpen className="w-5 h-5" />
                        <p>
                          {listingInfo.listing.bedrooms}{" "}
                          {listingInfo.listing.bedrooms > 1
                            ? "Bedrooms"
                            : "Bedroom"}
                        </p>
                      </Card>
                      <Card className="px-2 py-1 col-span-1 flex flex-row gap-1 justify-start items-center w-fit">
                        <Bed className="w-5 h-5" />
                        <p>
                          {listingInfo.listing.beds}{" "}
                          {listingInfo.listing.beds > 1 ? "Beds" : "Bed"}
                        </p>
                      </Card>
                      <Card className="px-2 py-1 col-span-1 flex flex-row gap-1 justify-start items-center w-fit">
                        <Bath className="w-5 h-5" />
                        <p>
                          {listingInfo.listing.bathrooms}{" "}
                          {listingInfo.listing.bathrooms > 1
                            ? "Bathrooms"
                            : "Bathroom"}
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
                      }) || <p>No description available.</p>}
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
                        <span className="font-semibold">Permit: </span>
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
                          <p className="text-lg font-semibold">The space</p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.space}
                          </div>
                        </>
                      )}
                      {listingTranslated?.neighborhood_overview && (
                        <>
                          <p className="text-lg font-semibold">
                            The neighborhood
                          </p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.neighborhood_overview}
                          </div>
                        </>
                      )}
                      {listingTranslated?.house_rules && (
                        <>
                          <p className="text-lg font-semibold">House rules</p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.house_rules}
                          </div>
                        </>
                      )}
                      {listingTranslated?.access && (
                        <>
                          <p className="text-lg font-semibold">Guest access</p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.access}
                          </div>
                        </>
                      )}
                      {listingTranslated?.notes && (
                        <>
                          <p className="text-lg font-semibold">
                            Other things to note
                          </p>
                          <div className="flex flex-col gap-1 w-full">
                            {listingTranslated.notes}
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
                          Amenities
                        </p>
                        {listingInfo.amenities.map((amenities) => {
                          return (
                            <Amenitie key={amenities.id} amenitie={amenities} />
                          );
                        })}
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
      </div>
    </div>
  );
};
