"use client";

import { ListingType } from "@/schemas/listing.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { useState, useEffect } from "react";
import { ListingHomeCard } from "../listings/listing-home-card";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export const RecommendedListings = () => {
  const [listings, setListings] = useState<ListingType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getListings = async () => {
      try {
        setLoading(true);
        const listings = await hostifyRequest<{
          listings: ListingType[];
          total: number;
        }>("listings", "GET", undefined, undefined, undefined, {
          page: 1,
          perPage: 12,
        });
        setListings(listings.listings);
      } catch (error) {
        console.log(error);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    getListings();
  }, []);
  return (
    <div className="w-full flex flex-col max-w-7xl my-12 lg:px-12 md:px-8 sm:px-6 px-4 gap-12">
      <h1 className="text-3xl font-semibold text-primary">Some of our rooms</h1>
      <div className="grid lg:grid-cols-4 md:grid-cols-3 min-[500px]:grid-cols-2 grid-cols-1 w-full gap-4">
        {loading &&
          Array.from({ length: 15 }, (v, i) => i).map((i) => {
            return (
              <Card
                key={i}
                className="w-full max-w-sm mx-auto flex flex-col items-center gap-0 relative p-0"
              >
                <Skeleton className="w-full h-auto aspect-[4/2] rounded-t-xl" />
                <CardContent className="flex flex-col w-full p-2 mt-auto gap-1">
                  <Skeleton className="w-[90%] h-6" />
                  <Skeleton className="w-[80%] h-5" />
                  <div className="flex flex-row items-center justify-between w-full font-sans">
                    <div className="flex flex-row items-center justify-start gap-2">
                      <Skeleton className="w-[15%] h-4" />
                    </div>
                    <div className="">
                      <Skeleton className="w-[20%] h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        {!loading &&
          listings.map((listing) => {
            if (listing.is_listed)
              return <ListingHomeCard key={listing.id} listing={listing} />;
          })}
      </div>
    </div>
  );
};
