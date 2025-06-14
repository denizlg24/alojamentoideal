"use client";

import { isValid, parseISO } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { ListingType } from "@/schemas/listing.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { ListingHomeCard } from "../listings/listing-home-card";
import { PaginationControls } from "../ui/pagination-controls";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";
import { RoomsMapHolder } from "./rooms-map-holder";
import { useTranslations } from "next-intl";

export const ListingsHolder = ({ locale }: { locale: string }) => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const [guests, updateGuests] = useState<{
    adults: number;
    children: number;
    infants: number;
    pets: number;
  }>({ adults: 1, children: 0, infants: 0, pets: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<ListingType[]>([]);
  const [pagination, setPagination] = useState({
    perPage: 24,
    totalPages: 0,
    page: 1,
    total: 0,
  });

  const searchParams = useSearchParams();

  const getAllListings = async (page: number, perPage: number) => {
    try {
      setIsLoading(true);
      const listings = await hostifyRequest<{
        listings: ListingType[];
        total: number;
      }>("listings", "GET", undefined, undefined, undefined, {
        page,
        perPage,
      });
      setListings(listings.listings);
      setPagination((prev) => {
        return {
          ...prev,
          total: listings.total,
          totalPages: Math.ceil(listings.total / prev.perPage),
        };
      });
    } catch (error) {
      console.log(error);
      setListings([]);
      setPagination((prev) => {
        return {
          ...prev,
          total: 0,
          totalPages: 0,
        };
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const newFrom = fromParam ? parseISO(fromParam) : undefined;
    const newTo = toParam ? parseISO(toParam) : undefined;

    if (newFrom && isValid(newFrom)) {
      setDate((prev) => ({
        to: prev?.to,
        from: newFrom,
      }));
    }

    if (newTo && isValid(newTo)) {
      setDate((prev) => ({
        from: prev?.from,
        to: newTo,
      }));
    }

    const adults = parseInt(searchParams.get("adults") || "1", 10);
    const children = parseInt(searchParams.get("children") || "0", 10);
    const infants = parseInt(searchParams.get("infants") || "0", 10);
    const pets = parseInt(searchParams.get("pets") || "0", 10);

    updateGuests({
      adults,
      children,
      infants,
      pets,
    });
  }, [searchParams]);

  useEffect(() => {
    setListings([]);
    if (date?.from && date.to) {
    } else {
      getAllListings(pagination.page, pagination.perPage);
    }
  }, [guests, date, pagination.page, pagination.perPage]);

  useEffect(() => {
    const page_string = searchParams.get("page");
    if (page_string) {
      const page = parseInt(page_string);
      setPagination((prev) => {
        return { ...prev, page: page || 1 };
      });
    }
  }, [searchParams]);

  const t = useTranslations("rooms");

  return (
    <div className="grid grid-cols-3 items-start w-full gap-6">
      <div className="grid xl:grid-cols-3 min-[500px]:grid-cols-2 grid-cols-1 gap-4 md:col-span-2 col-span-3">
        {isLoading && (
          <div className="flex flex-col col-span-full w-full gap-1">
            <Skeleton className="col-span-full w-[50%] h-7" />
            <Skeleton className="col-span-full w-[35%] h-5" />
          </div>
        )}
        {!isLoading && !(date?.from && date.to) && (
          <h1 className="col-span-full md:text-lg sm:text-base text-sm font-normal gap-0 flex flex-col">
            <span>{t("all")}</span>
            <span className="sm:text-sm text-xs text-muted-foreground/50">
              {t("adjust")}
            </span>
          </h1>
        )}
        {!isLoading && date?.from && date.to && listings.length > 0 && (
          <h1 className="col-span-full md:text-lg sm:text-base text-sm font-normal gap-0 flex flex-col">
            <span>
              {t("showing")}{" "}
              <span className="font-semibold">{pagination.total}</span>
              {t("rooms")}
            </span>
            <span className="sm:text-sm text-xs text-muted-foreground/50">
              {t("showing-info")}
            </span>
          </h1>
        )}
        {!isLoading && listings.length == 0 && (
          <h1 className="col-span-full md:text-lg sm:text-base text-sm font-normal gap-0 flex flex-col">
            <span>{t("no-rooms")}</span>
            <span className="sm:text-sm text-xs text-muted-foreground/50">
              {t("no-help")}
            </span>
          </h1>
        )}
        <div className="col-span-full w-full md:hidden flex flex-row items-start h-[300px] rounded-xl shadow overflow-hidden">
          <RoomsMapHolder
            locale={locale}
            listings={listings}
            isLoading={isLoading}
          />
        </div>
        {!isLoading &&
          listings.map((listing) => {
            return (
              <ListingHomeCard
                className={"max-w-full!"}
                key={listing.id}
                listing={listing}
              />
            );
          })}
        {!isLoading && pagination.totalPages > 1 && listings.length > 0 && (
          <div className="col-span-full">
            <PaginationControls
              className="justify-center"
              totalPages={pagination.totalPages}
            />
          </div>
        )}
        {isLoading &&
          Array.from({ length: 24 }, (v, i) => i).map((i) => {
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
      </div>
      <div className="col-span-1 w-full sticky top-44 md:flex hidden flex-row items-start h-[calc(100vh-64px-70px-48px-72px)] mt-16 rounded-xl shadow overflow-hidden">
        <RoomsMapHolder
          locale={locale}
          listings={listings}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
