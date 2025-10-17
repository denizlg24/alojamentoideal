"use client";
import { useEffect, useState } from "react";
import { AccommodationMap } from "./accommodation-map";
import { ListingType } from "@/schemas/listing.schema";
import { BedDouble, Loader2 } from "lucide-react";
import { hostifyRequest } from "@/utils/hostify-request";
import { RecommendedListings } from "@/app/[locale]/(frontend)/recommended-listings";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

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
  const t = useTranslations("home");

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
    <>
      <div className="flex flex-row items-stretch w-full h-[350px] rounded-xl overflow-hidden relative mt-2">
        <AccommodationMap listings={listings} />
        {loading && (
          <div className="absolute left-2 bottom-2">
            <Loader2 className="animate-spin w-3 h-3" />
          </div>
        )}
      </div>
      <div className="w-full mx-auto flex flex-col gap-4 mt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-7xl mx-auto text-left"
        >
          <h1 className="md:text-2xl sm:text-xl text-lg font-semibold flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-primary" />
            {t("staying-in", { city: "Porto" })}
          </h1>
        </motion.div>
        <RecommendedListings
          loading={loading}
          listings={listings}
          ids={[700029813, 700029814, 700042996, 700029827]}
        />
      </div>
    </>
  );
}
