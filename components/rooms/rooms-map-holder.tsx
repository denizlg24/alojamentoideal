"use client";
import { ListingType } from "@/schemas/listing.schema";
import { Skeleton } from "../ui/skeleton";
import { RoomsMap } from "./rooms-map";

export const RoomsMapHolder = ({
  locale,
  isLoading,
  listings,
}: {
  locale: string;
  isLoading: boolean;
  listings: ListingType[];
}) => {
  return isLoading ? (
    <Skeleton className="w-full h-full" />
  ) : (
    <RoomsMap locale={locale} listings={listings} />
  );
};
