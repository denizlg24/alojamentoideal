"use client";
import { AccommodationMap } from "./accommodation-map";
import { ListingType } from "@/schemas/listing.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { useEffect, useState } from "react";
import { AccommodationMapTitle } from "./accommodation-map-title";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";

export const AccommodationMapHolder = () => {
  const [listings, setListings] = useState<ListingType[]>([]);
  const [loading, setLoading] = useState(false);
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
    const loadAll = async () => {
      setListings([]);
      setLoading(true);
      const firstPage = await getListings(10, 1);
      setListings(firstPage);
      setLoading(false);
      const promises = [];
      for (let index = 2; index <= 80 / 10; index++) {
        promises.push(getListings(10, index));
      }
      setLoading(true);
      const remaining = await Promise.all(promises);
      setLoading(false);
      setListings((prev) => [...prev, ...remaining.flat()]);
    };

    loadAll();
  }, []);

  return (
    <>
      <AccommodationMapTitle />
      <div className="flex flex-row items-stretch w-full h-[350px] rounded-xl overflow-hidden relative">
        <AccommodationMap listings={listings} />
        {loading && (
          <div className="absolute left-0 bottom-0">
            <Button
              className="disabled hover:no-underline text-foreground"
              variant={"link"}
            >
              <Loader2 className="animate-spin z-95" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
