"use client";
import { AccommodationMap } from "./accommodation-map";
import { ListingType } from "@/schemas/listing.schema";
import { Skeleton } from "../ui/skeleton";
import { hostifyRequest } from "@/utils/hostify-request";
import { useEffect, useState } from "react";
import { AccommodationMapTitle } from "./accommodation-map-title";

export const AccommodationMapHolder = ({ locale }: { locale: string }) => {
  const [listings, setListings] = useState<ListingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const getListings = async () => {
      try {
        setIsLoading(true);
        const listings = await hostifyRequest<{
          listings: ListingType[];
          total: number;
        }>("listings", "GET", undefined, undefined, undefined, {
          page: 1,
          perPage: 80,
        });
        setListings(listings.listings);
      } catch (error) {
        console.log(error);
        setListings([]);
      } finally {
        setIsLoading(false);
      }
    };
    getListings();
  }, []);

  return isLoading ? (
    <Skeleton className="w-full h-[400px]" />
  ) : (
    <>
      <AccommodationMapTitle />
      <AccommodationMap locale={locale} listings={listings} />
    </>
  );
};
