"use client";
import { ListingType } from "@/schemas/listing.schema";
import { Skeleton } from "../ui/skeleton";
import { RoomsMap } from "./rooms-map";

export const RoomsMapHolder = ({
  isLoading,
  listings,
}: {
  isLoading: boolean;
  listings: ListingType[];
}) => {
  return isLoading || !listings ? (
    <Skeleton className="w-full h-full" />
  ) : (
    <RoomsMap listings={listings} />
  );
};
