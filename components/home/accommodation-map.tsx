"use client";
import { Link } from "@/i18n/navigation";
import { ListingType } from "@/schemas/listing.schema";
import { AdvancedMarker, APIProvider, Map } from "@vis.gl/react-google-maps";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { ArrowUpRightFromSquare, MapPinHouse } from "lucide-react";
import { ListingHomeCard } from "../listings/listing-home-card";
export const AccommodationMap = ({
  locale,
  listings,
}: {
  locale: string;
  listings: ListingType[];
}) => {
  return (
    <APIProvider
      language={locale}
      apiKey={"AIzaSyDcoJI8dKtvljH4lS7Qo8ywcyLOU9qcDi0"}
    >
      <Map
        style={{ width: "100%", height: "400px" }}
        mapId={"home_map"}
        defaultCenter={{ lat: 41.1579, lng: -8.6291 }}
        defaultZoom={12}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        clickableIcons={false}
      >
        {listings.map((l) => {
          return (
            <AdvancedMarker key={l.id} position={{ lat: l.lat, lng: l.lng }}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="default" className="aspect-square">
                    <MapPinHouse />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-2 flex flex-col gap-1 z-99 rounded-xl">
                  <ListingHomeCard listing={l} />
                  <Button asChild>
                    <Link href={"/rooms/" + l.id}>
                      Book Now <ArrowUpRightFromSquare />
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
