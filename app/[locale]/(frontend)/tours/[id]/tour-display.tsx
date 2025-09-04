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
import { FullExperienceType, PickupPlaceDto } from "@/utils/bokun-requests";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { cn, localeMap } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, ExternalLink, UserLock } from "lucide-react";
import { formatDuration } from "date-fns";
import { Link } from "@/i18n/navigation";
import { RoomInfoMap } from "@/components/room/room-info-map";

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
}: {
  experience: FullExperienceType;
  meeting:
    | { type: "PICK_UP"; pickUpPlaces: PickupPlaceDto[] }
    | { type: "MEET_ON_LOCATION" }
    | { type: "MEET_ON_LOCATION_OR_PICK_UP"; pickUpPlaces: PickupPlaceDto[] };
}) => {
  const locale = useLocale();
  //const experienceTypesT = useTranslations("experienceTypes");
  const t = useTranslations("tourDisplay");
  const [api, setApi] = useState<CarouselApi>();
  const [scrollToIndex, setScrollToIndex] = useState<number | null>(null);
  const [photoZoomOpen, setPhotoZoomOpen] = useState(false);
  const [tab, setTab] = useState(0);
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

  return (
    <div className="w-full max-w-7xl px-4 flex flex-col gap-6 mt-6">
      <div className="md:grid hidden grid-cols-4 w-full rounded-2xl overflow-hidden gap-2">
        <div className="col-span-2 w-full h-auto aspect-[2/1.5] relative">
          {experience.photos[0] && (
            <Image
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
            <Image
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
            <Image
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
            <Image
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
                  Show all photos ({experience.photos.length})
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
                          <Image
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
            <Image
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
                <Image
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
      <div className="w-full lg:grid grid-cols-5 flex flex-col-reverse gap-8">
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
      </div>
    </div>
  );
};
