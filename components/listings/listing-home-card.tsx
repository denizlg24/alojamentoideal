"use client";

import { ListingType } from "@/schemas/listing.schema";
import Image from "next/image";
import { Card, CardContent } from "../ui/card";
import { Bed, DoorOpen, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { useTranslations } from "next-intl";
export const ListingHomeCard = ({
  listing,
  className,
}: {
  listing: ListingType;
  className?: string;
}) => {
  const t = useTranslations("listing-home-card");
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(true);
  return (
    <Link
      className={cn(
        "focus:outline-0 focus:ring-0 w-full max-w-sm mx-auto",
        className
      )}
      href={`/rooms/${listing.id}`}
    >
      <Card className="w-full flex flex-col items-center gap-0 relative p-0">
        {isLoadingThumbnail && (
          <Skeleton className="w-full h-auto aspect-[4/2]! rounded-t-xl absolute top-0" />
        )}
        <Image
          src={listing.thumbnail_file}
          alt={(listing.name ?? listing.nickname) + " - Thumbnail"}
          width={600}
          height={600}
          className={cn(
            "w-full h-auto aspect-[4/2] rounded-t-xl object-cover",
            isLoadingThumbnail ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => {
            setIsLoadingThumbnail(false);
          }}
        />
        <CardContent className="flex flex-col w-full truncate p-2 mt-auto gap-1">
          <h1 className="font-sans text-base font-medium w-full text-left truncate">
            {listing.name ||
              listing.nickname ||
              listing.integration_name ||
              listing.integration_nickname ||
              `Property in ${listing.city}`}
          </h1>
          <h2 className="w-full text-left text-sm font-sans truncate cursor-default -mt-2">
            {listing.street}
          </h2>
          <div className="flex flex-row items-center justify-between w-full font-sans">
            <div className="flex flex-row items-center justify-start gap-1">
              {listing.bedrooms > 0 && (
                <div className="flex flex-row items-center justify-start gap-1 text-muted-foreground">
                  <DoorOpen className="w-4 h-4" />
                  <p>{listing.bedrooms}</p>
                </div>
              )}
              {listing.beds > 0 && listing.bedrooms == 0 && (
                <div className="flex flex-row items-center justify-start gap-1 text-muted-foreground">
                  <Bed className="w-4 h-4" />
                  <p>{listing.beds}</p>
                </div>
              )}
              {listing.person_capacity > 0 && (
                <div className="flex flex-row items-center justify-start gap-1 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <p>{listing.person_capacity}</p>
                </div>
              )}
            </div>
            <div className="">
              <p className="text-sm font-semibold">
                <span className="text-xs">{t("from")}</span>
                {listing.position == "before"
                  ? `${listing.symbol}${listing.price}`
                  : `${listing.price}${listing.symbol}`}
                <span className="text-xs">/{t("night")}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
