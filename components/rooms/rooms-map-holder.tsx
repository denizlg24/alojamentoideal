"use client";
import { ListingType } from "@/schemas/listing.schema";
import { Skeleton } from "../ui/skeleton";
import { RoomsMap } from "./rooms-map";

export const RoomsMapHolder = ({
  isLoading,
  filters,
  listings,
  currentHref,
}: {
  isLoading: boolean;
  filters: {
    start?: Date;
    end?: Date;
    adults: number;
    children: number;
    infants: number;
    pets: number;
  };
  listings: ListingType[];
  currentHref: string;
}) => {
  return isLoading || !listings ? (
    <Skeleton className="w-full h-full" />
  ) : (
    <RoomsMap filters={filters} listings={listings} currentHref={currentHref} />
  );
};
