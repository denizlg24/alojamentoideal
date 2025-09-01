import { ListingType } from "@/schemas/listing.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { AccommodationMapTitle } from "./accommodation-map-title";
import { AccommodationMapClient } from "./accommodation-map-client";
import { useTranslations } from "next-intl";

export const AccommodationMapHolder = async () => {
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
  const firstListings = await getListings(10, 1);
  const t = useTranslations("home");

  return (
    <>
      <AccommodationMapTitle label={t("map-title")} />
      <AccommodationMapClient initialListings={firstListings} />
    </>
  );
};
