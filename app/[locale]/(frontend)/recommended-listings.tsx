"use client";
import { ListingHomeCard } from "@/components/listings/listing-home-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingType } from "@/schemas/listing.schema";

export const RecommendedListings = ({
  ids,
  listings,
  loading,
}: {
  ids: number[];
  listings: ListingType[];
  loading: boolean;
}) => {
  if (loading) {
    return (
      <Carousel className="w-full">
        <CarouselContent>
          {[1, 2, 3, 4, 5].map((listing) => {
            return (
              <CarouselItem
                key={listing}
                className="basis-full min-[400px]:basis-1/2 sm:basis-1/3 md:basis-1/4"
              >
                <Skeleton className="w-full h-[222px]" />
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    );
  }
  return (
    <Carousel className="w-full">
      <CarouselContent>
        {listings
          .filter((l) => ids.includes(l.id))
          .map((listing) => {
            return (
              <CarouselItem
                key={listing.id}
                className="basis-full min-[400px]:basis-1/2 sm:basis-1/3 md:basis-1/4"
              >
                <ListingHomeCard
                  className={"max-w-full!"}
                  key={listing.id}
                  listing={listing}
                />
              </CarouselItem>
            );
          })}
      </CarouselContent>
      <CarouselPrevious className="left-4 z-85" />
      <CarouselNext className="right-4 z-85" />
    </Carousel>
  );
};
