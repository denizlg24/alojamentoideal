"use client";
import { useEffect, useState } from "react";
import { AccommodationMap } from "./accommodation-map";
import { ListingType } from "@/schemas/listing.schema";
import { Loader2 } from "lucide-react";
import { hostifyRequest } from "@/utils/hostify-request";

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
  }
};

export function AccommodationMapClient({
  initialListings,
}: {
  initialListings: ListingType[];
}) {
  const [listings, setListings] = useState<ListingType[]>(initialListings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRemaining = async () => {
      setLoading(true);
      const data = await getListings(80, 1);
      setListings(data);
      setLoading(false);
    };
    loadRemaining();
  }, [initialListings]);

  return (
    <div className="flex flex-row items-stretch w-full h-[350px] rounded-xl overflow-hidden relative">
      <AccommodationMap listings={listings} />
      {loading && (
        <div className="absolute left-2 bottom-2">
          <Loader2 className="animate-spin w-3 h-3" />
        </div>
      )}
    </div>
  );
}
