"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { cn, localeMap } from "@/lib/utils";
import { ActivityPreviewResponse } from "@/utils/bokun-requests";
import { formatDuration } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CircleUser,
  Clock,
  Loader2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

export const ActivityPreviewCard = ({
  activity,
  className,
}: {
  activity: ActivityPreviewResponse;
  className?: string;
}) => {
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const t = useTranslations("activity-preview-card");
  const locale = useLocale();

  function ImageSliderDots({
    total,
    className,
  }: {
    total: number;
    className?: string;
  }) {
    const visibleDots = 5;

    const half = Math.floor(visibleDots / 2);
    let start = Math.max(0, selectedImg - half);
    let end = Math.min(total - 1, selectedImg + half);

    if (end - start < visibleDots - 1) {
      if (start === 0) {
        end = Math.min(total - 1, start + visibleDots - 1);
      } else if (end === total - 1) {
        start = Math.max(0, end - visibleDots + 1);
      }
    }

    const windowIndexes = Array.from(
      { length: end - start + 1 },
      (_, i) => start + i
    );

    return (
      <div className={cn("flex gap-2", className)}>
        {windowIndexes.map((i) => (
          <div
            key={i}
            className={`transition-all rounded-full shadow
              ${
                i === selectedImg
                  ? "w-2.5 h-2.5 bg-white opacity-100"
                  : "w-2 h-2 bg-white opacity-50"
              }`}
          ></div>
        ))}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "w-full max-w-sm mx-auto flex flex-col items-center gap-0 relative p-0 border-0 shadow-xl",
        className
      )}
    >
      {isLoadingThumbnail && (
        <Skeleton className="w-full h-auto aspect-[1/0.75] flex items-center justify-center rounded-t-lg absolute top-0">
          <Loader2 className="animate-spin mx-auto w-4 h-4 text-primary" />
        </Skeleton>
      )}
      <div className="relative">
        <Image
          src={activity.photos[selectedImg].originalUrl}
          alt={activity.photos[selectedImg].caption || "Activity Picture"}
          width={600}
          height={600}
          className={cn(
            "w-full h-auto aspect-[1/0.75] rounded-t-lg object-cover",
            isLoadingThumbnail ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => {
            setIsLoadingThumbnail(false);
          }}
        />

        <ImageSliderDots
          total={activity.photos.length}
          className="absolute left-1/2 -translate-x-1/2 bottom-2 z-10 bg-black/50 p-1 flex flex-row items-center gap-1 rounded-full w-fit"
        />
        <button
          onClick={() => {
            setSelectedImg((prev) => {
              setIsLoadingThumbnail(true);
              if (prev == 0) {
                return activity.photos.length - 1;
              }
              return prev - 1;
            });
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 p-1 rounded-full"
        >
          <ChevronLeft className="text-white w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setIsLoadingThumbnail(true);
            setSelectedImg((prev) => {
              if (prev == activity.photos.length - 1) {
                return 0;
              }
              return prev + 1;
            });
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 p-1 rounded-full"
        >
          <ChevronRight className="text-white w-4 h-4" />
        </button>
      </div>
      <CardContent className="flex flex-col w-full p-4 gap-2 h-full justify-between">
        <div className="flex flex-col w-full gap-1">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-1">
              {(() => {
                switch (activity.difficultyLevel) {
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
              <p className="text-sm">{t(activity.difficultyLevel)}</p>
            </div>
            <div className="flex flex-row items-center justify-end gap-1 w-full max-w-[45%]">
              <CircleUser className="w-3 h-3 shrink-0" />
              <p className="text-xs text-muted-foreground truncate">
                {activity.minAge > 0 ? (
                  <>{t("ages-above", { age: activity.minAge })}</>
                ) : (
                  <>{t("any-age")}</>
                )}
              </p>
            </div>
          </div>
          <h1 className="font-sans text-sm font-medium w-full text-left">
            {activity.title}
          </h1>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {activity.shortDescription}
          </p>
        </div>
        <div className="mt-auto justify-self-end flex flex-col gap-2">
          <div className="flex flex-col w-full gap-1">
            <p className="text-xs font-semibold">{t("duration")}</p>
            <div className="flex flex-row items-center gap-2 justify-start w-full truncate">
              <Clock className="text-primary w-4 h-4" />
              <p className="text-xs">
                {formatDuration(activity.duration, {
                  locale: localeMap[locale as keyof typeof localeMap],
                })}
              </p>
            </div>
          </div>
          <Button asChild className="w-full" variant={"secondary"}>
            <Link href={`/tours/${activity.id}`}>{t("book-now")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
