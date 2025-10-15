"use client";
import { Link } from "@/i18n/navigation";
import { ListingType } from "@/schemas/listing.schema";
import { AdvancedMarker, APIProvider, Map } from "@vis.gl/react-google-maps";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { ArrowUpRightFromSquare, MapPinHouse } from "lucide-react";
import { ListingHomeCard } from "../listings/listing-home-card";
import { useLocale, useTranslations } from "next-intl";
import { ColorScheme } from "@vis.gl/react-google-maps";
import { RenderingType } from "@vis.gl/react-google-maps";
import { useMemo } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import React from "react";

export const AccommodationMap = ({ listings }: { listings: ListingType[] }) => {
  const t = useTranslations("home-map");
  const locale = useLocale();
  const mappedListings: Record<string, ListingType[]> = useMemo(() => {
    const GRID_SIZE = 0.002;
    const grouped: Record<string, ListingType[]> = {};

    for (const l of listings) {
      const latKey = Math.round(l.lat / GRID_SIZE);
      const lngKey = Math.round(l.lng / GRID_SIZE);
      const key = `${latKey},${lngKey}`;

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(l);
    }

    return grouped;
  }, [listings]);

  return (
    <APIProvider
      language={locale}
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
    >
      <Map
        style={{ width: "100%", height: "400px" }}
        mapId={"home_map_" + locale}
        defaultCenter={{ lat: 41.1579, lng: -8.6291 }}
        defaultZoom={12}
        colorScheme={ColorScheme.LIGHT}
        renderingType={RenderingType.VECTOR}
        gestureHandling={"auto"}
        disableDefaultUI={true}
        clickableIcons={false}
      >
        {Object.entries(mappedListings).map(([key, group]) => {
          const avgLat =
            group.reduce((sum, l) => sum + l.lat, 0) / group.length;
          const avgLng =
            group.reduce((sum, l) => sum + l.lng, 0) / group.length;
          return (
            <AdvancedMarker key={key} position={{ lat: avgLat, lng: avgLng }}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="default"
                    className="rounded-full p-1.5! h-fit! relative"
                  >
                    <MapPinHouse />
                    <div className="absolute w-4 h-4 bg-primary bottom-0 rotate-45 -z-10"></div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-2 flex flex-col gap-1 z-99 rounded-xl">
                  {group.length == 1 ? (
                    <>
                      <ListingHomeCard listing={group[0]} />
                      <Button asChild>
                        <Link href={"/rooms/" + group[0].id}>
                          {t("book")} <ArrowUpRightFromSquare />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-xs text-center">
                        {t("we-have-n-apartments-here", {
                          count: group.length,
                        })}
                      </p>
                      <Carousel className="w-full">
                        <CarouselContent>
                          {group.map((l) => {
                            return (
                              <div
                                className="flex flex-col items-center gap-1 w-[299x]! min-w-[299px] pl-4 "
                                key={l.id}
                              >
                                <ListingHomeCard listing={l} />
                                <Button className="w-full" asChild>
                                  <Link href={"/rooms/" + l.id}>
                                    {t("book")} <ArrowUpRightFromSquare />
                                  </Link>
                                </Button>
                              </div>
                            );
                          })}
                        </CarouselContent>
                        <CarouselNext className="right-2" />
                        <CarouselPrevious className="left-2" />
                      </Carousel>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </AdvancedMarker>
          );
        })}
      </Map>
    </APIProvider>
  );
};
