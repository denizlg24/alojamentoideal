"use client";
import sanitizeHtml from "sanitize-html";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  categoriesMap,
  ExperienceAvailabilityDto,
  ExperienceRateDto,
  ExperienceStartTimeDto,
  FullExperienceType,
  PickupPlaceDto,
} from "@/utils/bokun-requests";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { cn, localeMap } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BusFront,
  Check,
  CheckCircle,
  ChevronLeft,
  Clock,
  ExternalLink,
  MinusCircle,
  PlusCircle,
  ShoppingBasket,
  UserLock,
  Users,
} from "lucide-react";
import { format, formatDuration, isSameDay } from "date-fns";
import { Link } from "@/i18n/navigation";
import { RoomInfoMap } from "@/components/room/room-info-map";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { TourItem, useCart } from "@/hooks/cart-context";

export function cleanHtml(input: string) {
  const sanitized = sanitizeHtml(input, {
    allowedTags: sanitizeHtml.defaults.allowedTags,
    allowedAttributes: {},
    exclusiveFilter: (frame) => {
      if (
        frame.tag === "p" &&
        frame.text.trim() === "" &&
        (!frame.mediaChildren || frame.mediaChildren.every((c) => c === "br"))
      ) {
        return true;
      }
      return false;
    },
  });

  return sanitized;
}

export const TourDisplay = ({
  experience,
  meeting,
  initialAvailability,
}: {
  experience: FullExperienceType;
  meeting:
    | { type: "PICK_UP"; pickUpPlaces: PickupPlaceDto[] }
    | { type: "MEET_ON_LOCATION" }
    | { type: "MEET_ON_LOCATION_OR_PICK_UP"; pickUpPlaces: PickupPlaceDto[] };
  initialAvailability: ExperienceAvailabilityDto[];
}) => {
  const locale = useLocale();
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  //const experienceTypesT = useTranslations("experienceTypes");
  const t = useTranslations("tourDisplay");
  const [api, setApi] = useState<CarouselApi>();
  const [scrollToIndex, setScrollToIndex] = useState<number | null>(null);
  const [photoZoomOpen, setPhotoZoomOpen] = useState(false);
  const [guests, setGuests] = useState<{ [categoryId: number]: number }>({});
  const [tab, setTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedRate, setSelectedRate] = useState<
    ExperienceRateDto | undefined
  >(undefined);
  const [selectedTime, setSelectedTime] = useState<
    ExperienceStartTimeDto | undefined
  >();
  useEffect(() => {
    if (photoZoomOpen && api && scrollToIndex != null) {
      api.scrollTo(scrollToIndex);
    }
  }, [photoZoomOpen, api, scrollToIndex]);
  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (contentRef.current) {
      setShowButton(contentRef.current.scrollHeight > 150);
    }
  }, [contentRef]);

  const [experienceAvailability] = useState(initialAvailability);
  const selectedAvailability = selectedDate
    ? experienceAvailability.find((avail) =>
        isSameDay(new Date(avail.date), selectedDate)
      )
    : undefined;

  return (
    <div className="w-full max-w-7xl px-4 flex flex-col gap-6 mt-6">
      <div className="md:grid hidden grid-cols-4 w-full rounded-2xl overflow-hidden gap-2">
        <div className="col-span-2 w-full h-auto aspect-[2/1.5] relative">
          {experience.photos[0] && (
            <Image unoptimized 
              src={experience.photos[0].originalUrl}
              alt={experience.photos[0].caption || "Photo 0"}
              width={1920}
              height={1080}
              onClick={() => {
                setScrollToIndex(0);
                setPhotoZoomOpen(true);
              }}
              className="w-full h-full object-cover hover:cursor-zoom-in"
            />
          )}
        </div>
        <div className="col-span-1 w-full h-full flex flex-col relative gap-2">
          {experience.photos[1] && (
            <Image unoptimized 
              src={experience.photos[1].originalUrl}
              alt={experience.photos[1].caption || "Photo 0"}
              width={1920}
              height={1080}
              onClick={() => {
                setScrollToIndex(1);
                setPhotoZoomOpen(true);
              }}
              className="w-full h-auto aspect-[2/1.5] object-cover hover:cursor-zoom-in"
            />
          )}
          {experience.photos[2] && (
            <Image unoptimized 
              src={experience.photos[2].originalUrl}
              alt={experience.photos[2].caption || "Photo 2"}
              width={1920}
              height={1080}
              onClick={() => {
                setScrollToIndex(2);
                setPhotoZoomOpen(true);
              }}
              className="w-full h-auto aspect-[2/1.5] object-cover hover:cursor-zoom-in"
            />
          )}
        </div>
        <div className="col-span-1 w-full h-full flex flex-col relative gap-2">
          {experience.photos[3] && (
            <Image unoptimized 
              src={experience.photos[3].originalUrl}
              alt={experience.photos[3].caption || "Photo 3"}
              width={1920}
              height={1080}
              onClick={() => {
                setScrollToIndex(3);
                setPhotoZoomOpen(true);
              }}
              className="w-full h-auto aspect-[2/1.5] object-cover hover:cursor-zoom-in"
            />
          )}
          <div className="w-full h-auto aspect-[2/1.5] bg-foreground/50 flex flex-col justify-end items-center pb-4 relative">
            <Dialog
              open={photoZoomOpen}
              onOpenChange={(o) => {
                if (o) {
                  setScrollToIndex(0);
                }
                setPhotoZoomOpen(o);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full lg:text-sm text-xs hover:scale-[1.01] transition-transform"
                >
                  {t("show-all-photos")} ({experience.photos.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100vw-32px)]! w-full!">
                <DialogHeader className="items-center! text-center!">
                  <DialogTitle className="items-center! text-center!">
                    {experience.title}
                  </DialogTitle>
                  <DialogDescription className="items-center! text-center!">
                    Photo Tour
                  </DialogDescription>
                </DialogHeader>
                {experience.photos && (
                  <Carousel
                    setApi={setApi}
                    className="w-full mx-auto rounded-2xl overflow-hidden"
                  >
                    <CarouselContent className="rounded-2xl mx-auto">
                      {experience.photos.map((photo, index) => (
                        <CarouselItem key={index}>
                          <Image unoptimized 
                            src={photo.originalUrl}
                            alt={photo.caption ?? "photo-" + index}
                            width={1920}
                            height={1080}
                            className="h-full w-full object-contain rounded-2xl max-h-[80vh]"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-0" />
                    <CarouselNext className="right-0" />
                  </Carousel>
                )}
              </DialogContent>
            </Dialog>
            <Image unoptimized 
              src={experience.photos[4].originalUrl}
              alt="photo 4"
              className="w-full h-auto aspect-[2/1.5] object-cover absolute -z-10 top-0"
              width={1920}
              height={1080}
            />
          </div>
        </div>
      </div>
      {experience.photos && (
        <Carousel className="w-full md:hidden">
          <CarouselContent>
            {experience.photos.map((photo, index) => (
              <CarouselItem key={index}>
                <Image unoptimized 
                  src={photo.originalUrl}
                  alt={photo.caption ?? "photo-" + index}
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
      <div className="w-full lg:grid grid-cols-5 flex flex-col-reverse items-start gap-8">
        <div className="flex flex-col gap-6 col-span-3">
          <div className="w-full flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">{experience.title}</h1>
            <div className="flex flex-row items-center justify-start gap-3">
              <div className="flex flex-row items-center gap-1">
                <Clock className="text-primary w-4 h-4" />
                <p className="text-sm">
                  {formatDuration(experience.duration, {
                    locale: localeMap[locale as keyof typeof localeMap],
                  })}
                </p>
              </div>
              <div className="flex flex-row items-center gap-1">
                {(() => {
                  switch (experience.difficultyLevel) {
                    case "VERY_EASY":
                      return (
                        <div className="w-3 h-3 shrink-0 rounded-full border bg-green-300"></div>
                      );
                    case "EASY":
                      return (
                        <div className="w-3 h-3 shrink-0 rounded-full border bg-green-500"></div>
                      );
                    case "MODERATE":
                      return (
                        <div className="w-3 h-3 shrink-0 rounded-full border bg-yellow-400"></div>
                      );
                    case "CHALLENGING":
                      return (
                        <div className="w-3 h-3 shrink-0 rounded-full border bg-amber-600"></div>
                      );
                    case "DEMANDING":
                      return (
                        <div className="w-3 h-3 shrink-0 rounded-full border bg-red-500"></div>
                      );
                    case "EXTREME":
                      return (
                        <div className="w-3 h-3 shrink-0 rounded-full border bg-red-800"></div>
                      );
                  }
                })()}
                <p className="text-sm">{t(experience.difficultyLevel)}</p>
              </div>
              {experience.privateExperience && (
                <div className="flex flex-row items-center gap-1">
                  <UserLock className="text-primary w-4 h-4" />
                  <p className="text-sm">{t("private")}</p>
                </div>
              )}
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
              {t("experience-details")}
            </Button>
            <Button
              onClick={() => {
                setTab(1);
              }}
              className="col-span-1 text-foreground hover:no-underline hover:cursor-pointer rounded-none"
              variant="link"
            >
              {t("experience-itinerary")}
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
                    <div
                      className={cn(
                        "w-full flex flex-col prose-sm lg:prose gap-0!"
                      )}
                      dangerouslySetInnerHTML={{
                        __html: cleanHtml(experience.description),
                      }}
                    ></div>
                    {experience.inclusions.length > 0 && (
                      <div className="w-full flex flex-col gap-2 items-start text-left">
                        <p className="sm:text-lg text-base font-semibold">
                          {t("inclusions")}
                        </p>
                        <div
                          className={cn(
                            "w-full flex flex-col prose-sm lg:prose gap-0!"
                          )}
                        >
                          <ul>
                            {experience.inclusions.map((inclusion) => (
                              <li key={inclusion}>{t(inclusion)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {experience.included && (
                      <div className="w-full flex flex-col gap-2 items-start text-left">
                        <p className="sm:text-lg text-base font-semibold">
                          {t("included")}
                        </p>
                        <div
                          className={cn(
                            "w-full flex flex-col prose-sm lg:prose gap-0!"
                          )}
                          dangerouslySetInnerHTML={{
                            __html: cleanHtml(experience.included),
                          }}
                        ></div>
                      </div>
                    )}
                    {experience.exclusions.length > 0 && (
                      <div className="w-full flex flex-col gap-2 items-start text-left">
                        <p className="sm:text-lg text-base font-semibold">
                          {t("exclusions")}
                        </p>
                        <div
                          className={cn(
                            "w-full flex flex-col prose-sm lg:prose gap-0!"
                          )}
                        >
                          <ul>
                            {experience.exclusions.map((inclusion) => (
                              <li key={inclusion}>{t(inclusion)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {experience.excluded && (
                      <div className="w-full flex flex-col gap-2 items-start text-left">
                        <p className="sm:text-lg text-base font-semibold">
                          {t("excluded")}
                        </p>
                        <div
                          className={cn(
                            "w-full flex flex-col prose-sm lg:prose gap-0!"
                          )}
                          dangerouslySetInnerHTML={{
                            __html: cleanHtml(experience.excluded),
                          }}
                        ></div>
                      </div>
                    )}
                    {experience.knowBeforeYouGo.length > 0 && (
                      <div className="w-full flex flex-col gap-2 items-start text-left">
                        <p className="sm:text-lg text-base font-semibold">
                          {t("know-before-you-go-true")}
                        </p>
                        <div
                          className={cn(
                            "w-full flex flex-col prose-sm lg:prose gap-0!"
                          )}
                        >
                          <ul>
                            {experience.knowBeforeYouGo.map((inclusion) => (
                              <li key={inclusion}>{t(inclusion)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {experience.attention && (
                      <div className="w-full flex flex-col gap-2 items-start text-left">
                        <p className="sm:text-lg text-base font-semibold">
                          {t("know-before-you-go")}
                        </p>
                        <div
                          className={cn(
                            "w-full flex flex-col prose-sm lg:prose gap-0!"
                          )}
                          dangerouslySetInnerHTML={{
                            __html: cleanHtml(experience.attention),
                          }}
                        ></div>
                      </div>
                    )}
                    {experience.requirements && (
                      <div className="w-full flex flex-col gap-2 items-start text-left">
                        <p className="sm:text-lg text-base font-semibold">
                          {t("requirements")}
                        </p>
                        <div
                          className={cn(
                            "w-full flex flex-col prose-sm lg:prose gap-0!"
                          )}
                          dangerouslySetInnerHTML={{
                            __html: cleanHtml(experience.requirements),
                          }}
                        ></div>
                      </div>
                    )}
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
                    {experience.itinerary.map((ite) => {
                      return (
                        <React.Fragment key={ite.id}>
                          <h1 className="sm:text-lg text-base font-semibold">
                            {ite.title}
                          </h1>
                          <div
                            className={cn(
                              "w-full flex flex-col prose-sm lg:prose [&_p]:my-2! gap-0!"
                            )}
                            dangerouslySetInnerHTML={{
                              __html: cleanHtml(ite.description),
                            }}
                          ></div>
                        </React.Fragment>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {(() => {
            switch (meeting.type) {
              case "MEET_ON_LOCATION":
                return (
                  <div className="flex flex-col gap-4 items-start">
                    <Separator />
                    <p className="sm:text-lg text-base font-semibold">
                      {t("meet-on-location")}
                    </p>
                    <div className="flex flex-col w-full gap-4">
                      <p className="col-span-full text-base font-medium">
                        {t("where-can-we-meet")}
                      </p>
                      <div className="w-full h-[250px] rounded-lg overflow-hidden shadow">
                        <RoomInfoMap
                          lat={
                            experience.meetingType.meetingPointAddresses[0]
                              .address.latitude
                          }
                          long={
                            experience.meetingType.meetingPointAddresses[0]
                              .address.longitude
                          }
                          street={
                            experience.meetingType.meetingPointAddresses[0]
                              .title
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              case "PICK_UP":
                return (
                  <div className="flex flex-col gap-4 items-start">
                    <Separator />
                    <p className="sm:text-lg text-base font-semibold">
                      {t("we-pick-up")}
                    </p>
                    <div className="flex flex-col w-full gap-4">
                      <p className="col-span-full text-base font-medium">
                        {t("we-pick-you-up")}
                      </p>
                      <div className="grid sm:grid-cols-2 gap-x-2 gap-y-1">
                        <div className="col-span-full text-base">
                          <Button
                            asChild
                            variant={"link"}
                            className="p-0! h-fit!"
                          >
                            <Link
                              target="_blank"
                              href={
                                "https://www.google.com/maps?client=safari&sca_esv=4a27859b0637b078&rls=en&sxsrf=AE3TifM6QyZ51U17DjyUV71X-I26qlNsJg:1756988784720&gs_lp=Egxnd3Mtd2l6LXNlcnAiBnJlc3RhdSoCCAAyChAjGIAEGCcYigUyCxAAGIAEGJECGIoFMg0QABiABBhDGMkDGIoFMgsQABiABBiSAxiKBTIKEAAYgAQYFBiHAjIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyCxAuGIAEGMcBGK8BSP4OUABYuglwAHgBkAEAmAGfAaABrAaqAQMwLja4AQPIAQD4AQGYAgagAtMGwgIEECMYJ8ICCxAuGIAEGNEDGMcBwgIFEC4YgATCAhkQLhiABBhDGMcBGJgFGJkFGIoFGJ4FGK8BwgIXEC4YgAQYkQIYxwEYmAUYmQUYigUYrwHCAgoQABiABBhDGIoFmAMAkgcDMC42oAeHSrIHAzAuNrgH0wbCBwUyLTUuMcgHIg&um=1&ie=UTF-8&fb=1&gl=pt&sa=X&geocode=KUmNkAQAZSQNMY1vyICEIGOU&daddr=R.+Régulo+Magauanha+127,+4000-290+Porto"
                              }
                            >
                              {t("our-meeting-point")}
                              <ExternalLink />
                            </Link>
                          </Button>
                        </div>
                        <div className="flex flex-row items-center gap-2 col-span-full">
                          <Separator className="flex-1" />
                          <p className="shrink-0 text-xs text-muted-foreground">
                            {t("or")}
                          </p>
                          <Separator className="flex-1" />
                        </div>
                        <div
                          ref={contentRef}
                          className={cn(
                            "grid sm:grid-cols-2 gap-x-2 gap-y-1 transition-all duration-500 overflow-y-hidden col-span-full",
                            !expanded && "max-h-[150px]"
                          )}
                        >
                          {meeting.pickUpPlaces.map((pickUpPlace) => {
                            return (
                              <div
                                key={pickUpPlace.id}
                                className="col-span-1 text-sm text-muted-foreground even:text-right"
                              >
                                <p className="truncate">{pickUpPlace.title}</p>
                              </div>
                            );
                          })}
                        </div>
                        {showButton && (
                          <Button
                            className="w-full col-span-full"
                            onClick={() => {
                              setExpanded((prev) => !prev);
                              setShowButton(false);
                            }}
                            variant={"secondary"}
                          >
                            {t("show-all-places", {
                              count: meeting.pickUpPlaces.length,
                            })}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              case "MEET_ON_LOCATION_OR_PICK_UP":
                return (
                  <div className="flex flex-col gap-4 items-start">
                    <Separator />
                    <p className="sm:text-lg text-base font-semibold">
                      {t("we-pick-up")}
                    </p>
                    <div className="flex flex-col w-full gap-4">
                      <p className="col-span-full text-base font-medium">
                        {t("we-pick-you-up")}
                      </p>
                      <div className="grid sm:grid-cols-2 gap-x-2 gap-y-1">
                        <div className="col-span-full text-base">
                          <Button
                            asChild
                            variant={"link"}
                            className="p-0! h-fit!"
                          >
                            <Link
                              target="_blank"
                              href={
                                "https://www.google.com/maps?client=safari&sca_esv=4a27859b0637b078&rls=en&sxsrf=AE3TifM6QyZ51U17DjyUV71X-I26qlNsJg:1756988784720&gs_lp=Egxnd3Mtd2l6LXNlcnAiBnJlc3RhdSoCCAAyChAjGIAEGCcYigUyCxAAGIAEGJECGIoFMg0QABiABBhDGMkDGIoFMgsQABiABBiSAxiKBTIKEAAYgAQYFBiHAjIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyCxAuGIAEGMcBGK8BSP4OUABYuglwAHgBkAEAmAGfAaABrAaqAQMwLja4AQPIAQD4AQGYAgagAtMGwgIEECMYJ8ICCxAuGIAEGNEDGMcBwgIFEC4YgATCAhkQLhiABBhDGMcBGJgFGJkFGIoFGJ4FGK8BwgIXEC4YgAQYkQIYxwEYmAUYmQUYigUYrwHCAgoQABiABBhDGIoFmAMAkgcDMC42oAeHSrIHAzAuNrgH0wbCBwUyLTUuMcgHIg&um=1&ie=UTF-8&fb=1&gl=pt&sa=X&geocode=KUmNkAQAZSQNMY1vyICEIGOU&daddr=R.+Régulo+Magauanha+127,+4000-290+Porto"
                              }
                            >
                              {t("our-meeting-point")}
                              <ExternalLink />
                            </Link>
                          </Button>
                        </div>
                        <div className="flex flex-row items-center gap-2 col-span-full">
                          <Separator className="flex-1" />
                          <p className="shrink-0 text-xs text-muted-foreground">
                            {t("or")}
                          </p>
                          <Separator className="flex-1" />
                        </div>
                        <div
                          ref={contentRef}
                          className={cn(
                            "grid sm:grid-cols-2 gap-x-2 gap-y-1 transition-all duration-500 overflow-y-hidden col-span-full",
                            !expanded && "max-h-[150px]"
                          )}
                        >
                          {meeting.pickUpPlaces.map((pickUpPlace) => {
                            return (
                              <div
                                key={pickUpPlace.id}
                                className="col-span-1 text-sm text-muted-foreground"
                              >
                                <p className="truncate">{pickUpPlace.title}</p>
                              </div>
                            );
                          })}
                        </div>
                        {showButton && (
                          <Button
                            className="w-full col-span-full"
                            onClick={() => {
                              setExpanded((prev) => !prev);
                              setShowButton(false);
                            }}
                            variant={"secondary"}
                          >
                            {t("show-all-places", {
                              count: meeting.pickUpPlaces.length,
                            })}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
            }
          })()}
        </div>
        <div className="col-span-2 w-full max-w-lg mx-auto flex flex-col justify-start relative h-full">
          {false ? (
            <Skeleton className="w-full mx-auto p-4 flex flex-col gap-2 sticky top-20 h-[500px]" />
          ) : (
            <Card className="w-full mx-auto p-4 flex flex-col gap-2 sticky top-20">
              {experienceAvailability[0].rates[0].pricingCategoryIds.length ==
              1 ? (
                <div className="flex flex-row items-end gap-2 justify-between">
                  <div className="flex flex-col gap-0 shrink-0">
                    <p className="text-sm font-semibold text-left">
                      {t("passengers")}
                    </p>
                    <p className="text-xs text-left">
                      {t("ages-range", { min: experience.minAge, max: 80 })}
                    </p>
                  </div>

                  <div className="flex flex-row items-center justify-between w-fit gap-2 mt-2">
                    <Button
                      variant={"secondary"}
                      onClick={() => {
                        setGuests((prev) => {
                          const key =
                            experienceAvailability[0].rates[0]
                              .pricingCategoryIds[0];
                          if (!prev[key]) {
                            return { ...prev, [key]: 0 };
                          }
                          if (prev[key] == 1) {
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { [key]: _, ...rest } = prev;
                            return rest;
                          }
                          return { ...prev, [key]: prev[key] - 1 };
                        });
                      }}
                    >
                      <MinusCircle />
                    </Button>
                    <p className="text-sm w-12 text-center">
                      {guests[
                        experienceAvailability[0].rates[0].pricingCategoryIds[0]
                      ] ?? 0}
                    </p>
                    <Button
                      variant={"secondary"}
                      onClick={() => {
                        setGuests((prev) => {
                          const key =
                            experienceAvailability[0].rates[0]
                              .pricingCategoryIds[0];
                          if (!prev[key]) {
                            return { ...prev, [key]: 1 };
                          }
                          if (prev[key] == 100) {
                            return { ...prev, [key]: 100 };
                          }
                          return { ...prev, [key]: prev[key] + 1 };
                        });
                      }}
                    >
                      <PlusCircle />
                    </Button>
                  </div>
                </div>
              ) : (
                experienceAvailability[0].rates[0].pricingCategoryIds.map(
                  (id) => {
                    return (
                      <div
                        key={id}
                        className="flex flex-row items-end gap-2 justify-between"
                      >
                        <div className="flex flex-col gap-0 shrink-0">
                          <p className="text-sm font-semibold text-left">
                            {t(categoriesMap[id].title)}
                          </p>
                          {categoriesMap[id].min && categoriesMap[id].max && (
                            <p className="text-xs text-left">
                              {t("ages-range", {
                                min: categoriesMap[id].min,
                                max: categoriesMap[id].max,
                              })}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-row items-center justify-between w-fit gap-2 mt-2">
                          <Button
                            variant={"secondary"}
                            onClick={() => {
                              setGuests((prev) => {
                                const key = id;
                                if (!prev[key]) {
                                  return { ...prev, [key]: 0 };
                                }
                                if (prev[key] == 1) {
                                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                  const { [key]: _, ...rest } = prev;
                                  return rest;
                                }
                                return { ...prev, [key]: prev[key] - 1 };
                              });
                            }}
                          >
                            <MinusCircle />
                          </Button>
                          <p className="text-sm w-12 text-center">
                            {guests[id] ?? 0}
                          </p>
                          <Button
                            variant={"secondary"}
                            onClick={() => {
                              setGuests((prev) => {
                                const key = id;
                                if (!prev[key]) {
                                  return { ...prev, [key]: 1 };
                                }
                                if (prev[key] == 100) {
                                  return { ...prev, [key]: 100 };
                                }
                                return { ...prev, [key]: prev[key] + 1 };
                              });
                            }}
                          >
                            <PlusCircle />
                          </Button>
                        </div>
                      </div>
                    );
                  }
                )
              )}
              <Separator className="mt-4" />
              {!selectedDate && (
                <Calendar
                  locale={localeMap[locale as keyof typeof localeMap]}
                  mode="single"
                  className="w-full h-auto aspect-square border-0 mb-10 p-0 mt-4"
                  captionLayout="label"
                  startMonth={new Date()}
                  showOutsideDays={false}
                  weekStartsOn={1}
                  components={{
                    DayButton(props) {
                      const date = props.day.date;
                      const avail = experienceAvailability.find((avail) =>
                        isSameDay(new Date(avail.date), date)
                      );

                      if (date < new Date()) {
                        return (
                          <div className="w-full flex flex-col items-center justify-center h-full">
                            <span className="sm:text-sm text-xs">
                              {date.getDate()}
                            </span>
                          </div>
                        );
                      }

                      const totalGuests = Object.values(guests).reduce(
                        (sum, val) => sum + val,
                        0
                      );

                      if (!avail) {
                        return (
                          <div className="w-full flex flex-col items-center justify-center text-muted-foreground h-full">
                            <span className="sm:text-sm text-xs">
                              {date.getDate()}
                            </span>
                          </div>
                        );
                      }
                      if (!avail.unlimitedAvailability) {
                        if (
                          avail.availabilityCount == 0 ||
                          (avail.availabilityCount ?? 0) < totalGuests
                        ) {
                          return (
                            <div className="w-full flex flex-col items-center justify-center text-muted-foreground relative overflow-hidden h-full">
                              <span className="sm:text-sm text-xs">
                                {date.getDate()}
                              </span>
                              <span className="w-4 h-4 bg-destructive absolute -top-2 -right-2 rotate-45"></span>
                            </div>
                          );
                        }

                        if (
                          (avail.minParticipantsToBookNow ?? 0) > totalGuests
                        ) {
                          return (
                            <button className="w-full flex flex-col items-center justify-center relative overflow-hidden h-full">
                              <span className="sm:text-sm text-xs">
                                {date.getDate()}
                              </span>
                              <span className="text-[0.5rem] text-foreground font-normal flex flex-row items-center gap-1 justify-center text-center">
                                Min {avail.minParticipantsToBookNow}{" "}
                                <Users className="w-2 h-2 shrink-0" />
                              </span>
                              <span className="w-4 h-4 bg-yellow-300 absolute -top-2 -right-2 rotate-45"></span>
                            </button>
                          );
                        }
                      }
                      const ratePrices = avail.pricesByRate[0];
                      const prices = ratePrices.pricePerCategoryUnit;
                      let isPriceAvailable = true;
                      let displayPrice = 0;
                      for (const priceCategoryId in guests) {
                        if (
                          Object.prototype.hasOwnProperty.call(
                            guests,
                            priceCategoryId
                          )
                        ) {
                          const price = prices.find((price) => {
                            return (
                              price.id.toString() == priceCategoryId &&
                              price.maxParticipantsRequired >=
                                guests[priceCategoryId] &&
                              price.minParticipantsRequired <=
                                guests[priceCategoryId]
                            );
                          });
                          if (!price) {
                            isPriceAvailable = false;
                          } else {
                            displayPrice +=
                              price.amount.amount *
                              (avail.rates[0].pricedPerPerson ?? true
                                ? guests[priceCategoryId]
                                : 1);
                          }
                        }
                      }
                      if (isPriceAvailable) {
                        return (
                          <button
                            onClick={() => {
                              setSelectedDate(date);
                              setSelectedRate(avail.rates[0]);
                            }}
                            className="w-full flex flex-col items-center justify-center relative overflow-hidden h-full"
                          >
                            <span className="sm:text-sm text-xs">
                              {date.getDate()}
                            </span>
                            {displayPrice && (
                              <span className="min-[420px]:text-xs text-[0.5rem] text-green-600 font-medium">
                                €{displayPrice}
                              </span>
                            )}
                            <span className="w-4 h-4 bg-green-300 absolute -top-2 -right-2 rotate-45"></span>
                          </button>
                        );
                      }
                      return (
                        <div className="w-full flex flex-col items-center justify-center text-muted-foreground relative overflow-hidden h-full">
                          <span className="sm:text-sm text-xs">
                            {date.getDate()}
                          </span>
                          <span className="w-4 h-4 bg-destructive absolute -top-2 -right-2 rotate-45"></span>
                        </div>
                      );
                    },
                  }}
                  disabled={(date) => {
                    let shouldBeDisabled = false;
                    const avail = experienceAvailability.find((avail) =>
                      isSameDay(new Date(avail.date), new Date())
                    );
                    if (avail?.unlimitedAvailability) {
                      shouldBeDisabled = false;
                      return date < new Date() || (shouldBeDisabled ?? false);
                    } else {
                      if (avail?.availabilityCount == 0) {
                        shouldBeDisabled = true;
                        return date < new Date() || (shouldBeDisabled ?? false);
                      }
                      if ((avail?.minParticipantsToBookNow ?? 0) > 1) {
                        shouldBeDisabled = true;
                        return date < new Date() || (shouldBeDisabled ?? false);
                      }
                      return date < new Date();
                    }
                  }}
                />
              )}
              {selectedDate && selectedAvailability && (
                <div className="w-full flex flex-col gap-4 items-start">
                  <Button
                    variant={"link"}
                    onClick={() => {
                      setSelectedDate(undefined);
                      setSelectedRate(undefined);
                      setSelectedTime(undefined);
                    }}
                    className="px-0! h-fit!"
                  >
                    <ChevronLeft />{" "}
                    {format(selectedDate, "dd MMMM yyyy", {
                      locale: localeMap[locale as keyof typeof localeMap],
                    })}
                  </Button>
                  <div className="w-full flex flex-col items-center gap-6">
                    {selectedAvailability.rates.map((rate) => {
                      const totalGuests = Object.values(guests).reduce(
                        (sum, val) => sum + val,
                        0
                      );
                      if (!selectedAvailability.unlimitedAvailability) {
                        if (
                          selectedAvailability.availabilityCount == 0 ||
                          (selectedAvailability.availabilityCount ?? 0) <
                            totalGuests
                        ) {
                          setSelectedDate(undefined);
                        }

                        if (
                          (selectedAvailability.minParticipantsToBookNow ?? 0) >
                          totalGuests
                        ) {
                          setSelectedDate(undefined);
                        }
                      }
                      const prices = selectedAvailability.pricesByRate.find(
                        (priceByRate) => priceByRate.activityRateId == rate.id
                      )?.pricePerCategoryUnit;
                      let isPriceAvailable = true;
                      let displayPrice = 0;
                      for (const priceCategoryId in guests) {
                        if (
                          Object.prototype.hasOwnProperty.call(
                            guests,
                            priceCategoryId
                          )
                        ) {
                          const price = prices?.find(
                            (price) =>
                              price.id.toString() == priceCategoryId &&
                              price.maxParticipantsRequired >=
                                guests[priceCategoryId] &&
                              price.minParticipantsRequired <=
                                guests[priceCategoryId]
                          );
                          if (!price) {
                            isPriceAvailable = false;
                          } else {
                            displayPrice +=
                              price.amount.amount *
                              (rate.pricedPerPerson ?? true
                                ? guests[priceCategoryId]
                                : 1);
                          }
                        }
                      }
                      if (!isPriceAvailable) {
                        setSelectedDate(undefined);
                      }
                      return (
                        <button
                          onClick={() => {
                            setSelectedRate(rate);
                          }}
                          key={rate.id}
                          className={cn(
                            "w-full p-3! gap-2 relative border shadow rounded-lg flex flex-col",
                            selectedRate?.id == rate.id && "border-primary"
                          )}
                        >
                          {selectedRate?.id == rate.id && (
                            <div className="absolute right-1/10 -top-4 bg-primary rounded-lg shadow z-10 text-primary-foreground">
                              <p className="font-bold flex flex-row items-center gap-2 text-sm px-2 py-1">
                                <Check className="w-3 h-3 shrink-0" />{" "}
                                {t("selected")}
                              </p>
                            </div>
                          )}
                          <div className="flex flex-row items-center gap-8 w-full justify-between text-left">
                            <h1 className="text-sm font-semibold max-w-[60%}">
                              {rate.title}
                            </h1>
                            <p className="text-sm font-medium max-w-[30%]">
                              {displayPrice}€
                            </p>
                          </div>
                          <Separator />
                          {experience.meetingType.type !=
                            "MEET_ON_LOCATION" && (
                            <div className="flex flex-row items-center justify-start gap-1">
                              <BusFront className="w-4 h-4 shrink-0" />
                              <p className="min-[420px]:text-sm text-xs text-left">
                                {t("pickup-available")}
                                {rate.pickupPricingType ==
                                  "INCLUDED_IN_PRICE" &&
                                  ` (${t("included-in-price")})`}
                              </p>
                            </div>
                          )}

                          {experience.privateExperience && (
                            <div className="flex flex-row items-center justify-start gap-1">
                              <Users className="w-4 h-4 shrink-0" />
                              <p className="min-[420px]:text-sm text-xs text-left">
                                {t("private-experience-desc")}
                              </p>
                            </div>
                          )}
                          {!experience.privateExperience && (
                            <div className="flex flex-row items-center justify-start gap-1">
                              <Users className="w-4 h-4 shrink-0" />
                              <p className="min-[420px]:text-sm text-xs text-left">
                                {selectedAvailability.bookedParticipants}/
                                {selectedAvailability.availabilityCount +
                                  selectedAvailability.bookedParticipants}
                                {selectedAvailability.bookedParticipants >= 0
                                  ? `${t("booked-people", {
                                      count:
                                        selectedAvailability.bookedParticipants,
                                    })}`
                                  : ""}
                              </p>
                            </div>
                          )}
                          {selectedAvailability.flexible && (
                            <div className="flex flex-row items-center justify-start gap-1">
                              <Clock className="w-4 h-4 shrink-0" />
                              <p className="min-[420px]:text-sm text-xs text-left">
                                {t("flexible-info")}
                              </p>
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {selectedRate &&
                      experience.startTimes.some(
                        (startTime) =>
                          startTime.hour >= 0 && startTime.minute >= 0
                      ) && (
                        <div className="w-full flex flex-col gap-2">
                          <p className="text-sm text-left font-semibold w-full">
                            {t("start-times")}:
                          </p>
                          <div className="flex flex-row items-center justify-start gap-2 flex-wrap w-full">
                            {selectedRate &&
                              selectedRate.allStartTimes &&
                              experience.startTimes.map((startTime) => {
                                return (
                                  <Button
                                    variant={
                                      startTime.id == selectedTime?.id
                                        ? "outline"
                                        : "default"
                                    }
                                    onClick={() => {
                                      setSelectedTime((prev) =>
                                        prev == undefined
                                          ? startTime
                                          : undefined
                                      );
                                    }}
                                    className={cn(
                                      startTime.externalLabel && "h-fit",
                                      "transition-all relative"
                                    )}
                                    key={startTime.id}
                                  >
                                    {startTime.id == selectedTime?.id && (
                                      <CheckCircle className="w-3 h-3 -top-1.5 -right-1.5 absolute" />
                                    )}
                                    {startTime.externalLabel ? (
                                      <div className="flex flex-col gap-1 items-center">
                                        <div className="flex flex-row items-center gap-2">
                                          <Clock />
                                          {format(
                                            new Date(
                                              0,
                                              0,
                                              0,
                                              startTime.hour ?? 0,
                                              startTime.minute ?? 0
                                            ),
                                            "HH:mm"
                                          )}
                                        </div>
                                        <div className="flex flex-row items-center p-1 border rounded">
                                          <p className="text-xs font-semibold">
                                            {startTime.externalLabel}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <Clock />
                                        {format(
                                          new Date(
                                            0,
                                            0,
                                            0,
                                            startTime.hour ?? 0,
                                            startTime.minute ?? 0
                                          ),
                                          "HH:mm"
                                        )}
                                      </>
                                    )}
                                  </Button>
                                );
                              })}
                            {selectedRate &&
                              !selectedRate.allStartTimes &&
                              experience.startTimes
                                .filter((startTime) =>
                                  selectedRate.startTimeIds.find(
                                    (st) => st == startTime.id
                                  )
                                    ? true
                                    : false
                                )
                                .map((startTime) => {
                                  return (
                                    <Button
                                      variant={
                                        startTime.id == selectedTime?.id
                                          ? "outline"
                                          : "default"
                                      }
                                      onClick={() => {
                                        setSelectedTime((prev) =>
                                          prev == undefined
                                            ? startTime
                                            : undefined
                                        );
                                      }}
                                      className={cn(
                                        startTime.externalLabel && "h-fit",
                                        "transition-all relative"
                                      )}
                                      key={startTime.id}
                                    >
                                      {startTime.id == selectedTime?.id && (
                                        <CheckCircle className="w-3 h-3 -top-1.5 -right-1.5 absolute" />
                                      )}
                                      {startTime.externalLabel ? (
                                        <div className="flex flex-col gap-1 items-center">
                                          <div className="flex flex-row items-center gap-2">
                                            <Clock />
                                            {format(
                                              new Date(
                                                0,
                                                0,
                                                0,
                                                startTime.hour ?? 0,
                                                startTime.minute ?? 0
                                              ),
                                              "HH:mm"
                                            )}
                                          </div>
                                          <div className="flex flex-row items-center p-1 border rounded">
                                            <p className="text-xs font-semibold">
                                              {startTime.externalLabel}
                                            </p>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <Clock />
                                          {format(
                                            new Date(
                                              0,
                                              0,
                                              0,
                                              startTime.hour ?? 0,
                                              startTime.minute ?? 0
                                            ),
                                            "HH:mm"
                                          )}
                                        </>
                                      )}
                                    </Button>
                                  );
                                })}
                          </div>
                        </div>
                      )}
                  </div>
                  {selectedAvailability &&
                    selectedDate &&
                    selectedRate &&
                    (selectedTime || selectedAvailability.flexible) && (
                      <div className="flex flex-col gap-1 w-full">
                        <Button asChild className="w-full">
                          <Link
                            href={`/checkout/activity/${
                              experience.id
                            }?selectedRateId=${
                              selectedRate.id
                            }&date=${selectedDate}&startTimeId=${
                              selectedTime ? selectedTime.id : 0
                            }&guests=${JSON.stringify(guests)}`}
                          >
                            {t("book-now")} <ArrowRight />
                          </Link>
                        </Button>
                        <Button
                          onClick={() => {
                            const prices =
                              selectedAvailability.pricesByRate.find(
                                (priceByRate) =>
                                  priceByRate.activityRateId == selectedRate.id
                              )?.pricePerCategoryUnit;
                            let displayPrice = 0;
                            for (const priceCategoryId in guests) {
                              if (
                                Object.prototype.hasOwnProperty.call(
                                  guests,
                                  priceCategoryId
                                )
                              ) {
                                const price = prices?.find(
                                  (price) =>
                                    price.id.toString() == priceCategoryId &&
                                    price.maxParticipantsRequired >=
                                      guests[priceCategoryId] &&
                                    price.minParticipantsRequired <=
                                      guests[priceCategoryId]
                                );
                                if (price) {
                                  displayPrice +=
                                    price.amount.amount *
                                    (selectedRate.pricedPerPerson ?? true
                                      ? guests[priceCategoryId]
                                      : 1);
                                }
                              }
                            }
                            const newItem: TourItem = {
                              id: experience.id,
                              selectedDate: format(selectedDate,"yyyy-MM-dd"),
                              selectedStartTimeId: selectedTime
                                ? selectedTime.id
                                : 0,
                              selectedRateId: selectedRate.id,
                              guests,
                              photo: experience.photos[0].originalUrl,
                              type: "activity",
                              name: experience.title,
                              price: displayPrice,
                            };
                            addItem(newItem);
                            setJustAdded(true);
                            setTimeout(() => {
                              setJustAdded(false);
                            }, 1000);
                          }}
                          variant={"secondary"}
                          className="w-full"
                        >
                          {justAdded ? (
                            <>
                              {t("added")} <CheckCircle />
                            </>
                          ) : (
                            <>
                              {t("add-to-cart")} <ShoppingBasket />
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
