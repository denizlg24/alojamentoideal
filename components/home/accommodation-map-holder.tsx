"use client";
import { AccommodationMap } from "./accommodation-map";
import { ListingType } from "@/schemas/listing.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { useEffect, useState } from "react";
import { AccommodationMapTitle } from "./accommodation-map-title";

export const AccommodationMapHolder = () => {
  const [listings, setListings] = useState<ListingType[]>([]);
  useEffect(() => {
    const getListings = async (limit: number, page: number) => {
      try {
        const listings = await hostifyRequest<{
          listings: ListingType[];
          total: number;
        }>("listings", "GET", undefined, undefined, undefined, {
          page: page,
          perPage: limit,
        });
        return listings.listings;
      } catch {
        return [];
      } finally {
      }
    };
    setListings([]);
    for (let index = 1; index <= 80 / 10; index += 1) {
      getListings(10, index).then((_listings) => {
        setListings((prev) => {
          return [...prev, ..._listings];
        });
      });
    }
  }, []);

  return (
    <>
      <AccommodationMapTitle />
      <div className="flex flex-row items-stretch w-full rounded-xl overflow-hidden">
        <AccommodationMap listings={listings} />
      </div>
    </>
  );
};
