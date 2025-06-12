"use client";

import { ListingType } from "@/schemas/listing.schema";
import Image from "next/image";
import { Card, CardContent } from "../ui/card";
import { Bed, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
export const ListingHomeCard = ({ listing }: { listing: ListingType }) => {
  return (
    <Link
      className="focus:outline-0 focus:ring-0 w-full max-w-sm mx-auto"
      href={`/rooms/${listing.id}`}
    >
      <Card className="w-full flex flex-col items-center gap-0 relative p-0">
        <Image
          src={listing.thumbnail_file}
          alt={(listing.name ?? listing.nickname) + " - Thumbnail"}
          width={600}
          height={600}
          className="w-full h-auto aspect-[4/2] rounded-t-xl object-cover"
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
            <div className="flex flex-row items-center justify-start gap-2">
              {listing.beds > 0 && (
                <div className="flex flex-row items-center justify-start gap-1 text-muted-foreground">
                  <Bed className="w-4 h-4" />
                  <p>{listing.beds}</p>
                </div>
              )}
              {listing.guests_included > 0 && (
                <div className="flex flex-row items-center justify-start gap-1 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <p>{listing.guests_included}</p>
                </div>
              )}
            </div>
            <div className="">
              <p className="text-sm font-semibold">
                <span className="text-xs">Starting at </span>
                {listing.position == "before"
                  ? `${listing.symbol}${listing.price}`
                  : `${listing.price}${listing.symbol}`}
                <span className="text-xs">/night</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
