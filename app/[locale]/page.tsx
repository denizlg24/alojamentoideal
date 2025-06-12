"use client";

import { ListingHomeCard } from "@/components/listings/listing-home-card";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingType } from "@/schemas/listing.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import homeIllustration from "@/public/home-bg.jpg";

export default function Home() {
  const searchParams = useSearchParams();
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [listings, setListings] = useState<ListingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [perPage, setPerPage] = useState(20);

  useEffect(() => {
    const updatePerPage = () => {
      const width = window.innerWidth;

      if (width >= 1280) {
        setPerPage(20);
      } else if (width >= 768) {
        setPerPage(12);
      } else {
        setPerPage(7);
      }
    };

    updatePerPage();
    window.addEventListener("resize", updatePerPage);

    return () => window.removeEventListener("resize", updatePerPage);
  }, []);
  const [totalPages, setTotalPages] = useState(0);
  useEffect(() => {
    const getListings = async () => {
      try {
        setLoading(true);
        const listings = await hostifyRequest<{
          listings: ListingType[];
          total: number;
        }>("listings", "GET", undefined, undefined, undefined, {
          page: currentPage,
          perPage,
        });
        setListings(listings.listings);
        const pages = Math.ceil(listings.total / perPage);
        setTotalPages(pages);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setListings([]);
        setLoading(false);
        setTotalPages(0);
      }
    };
    getListings();
  }, [currentPage, perPage]);

  return (
    <main className="flex flex-col items-center w-full mx-auto">
      <div className="w-full relative">
        <Image
          src={homeIllustration}
          width={1920}
          height={1080}
          className="w-full h-auto lg:aspect-[3] aspect-[2] object-cover"
          alt="Home Illustration"
        />
      </div>
      <div className="grid lg:grid-cols-4 md:grid-cols-3 min-[500px]:grid-cols-2 grid-cols-1 w-full md:my-24 my-12 gap-4 max-w-7xl lg:px-12 md:px-8 sm:px-6 px-4 ">
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
        {totalPages > 0 && (
          <div className="mx-auto col-span-full">
            <PaginationControls totalPages={totalPages} />
          </div>
        )}
      </div>
    </main>
  );
}
