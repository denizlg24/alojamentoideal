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
export const AccommodationMap = ({ listings }: { listings: ListingType[] }) => {
  const t = useTranslations("home-map");
  const locale = useLocale();
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
        {listings?.map((l) => {
          return (
            <AdvancedMarker key={l.id} position={{ lat: l.lat, lng: l.lng }}>
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
                  <ListingHomeCard listing={l} />
                  <Button asChild>
                    <Link href={"/rooms/" + l.id}>
                      {t("book")} <ArrowUpRightFromSquare />
                    </Link>
                  </Button>
                </PopoverContent>
              </Popover>
            </AdvancedMarker>
          );
        })}
      </Map>
    </APIProvider>
  );
};
