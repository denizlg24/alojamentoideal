"use client";
import { AdvancedMarker, APIProvider, Map } from "@vis.gl/react-google-maps";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import {
  LocateFixedIcon,
  MapPinHouse,
  SquareArrowOutUpRightIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { ColorScheme } from "@vis.gl/react-google-maps";
import { RenderingType } from "@vis.gl/react-google-maps";
import { Link } from "@/i18n/navigation";
export const RoomInfoMap = ({
  lat,
  long,
  street,
}: {
  lat: number;
  long: number;
  street: string;
}) => {
  const locale = useLocale();
  return (
    <APIProvider
      language={locale}
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
    >
      <Map
        style={{ width: "100%", height: "100%" }}
        mapId={"rooms_map_" + street}
        defaultCenter={{ lat: lat, lng: long }}
        defaultZoom={15}
        colorScheme={ColorScheme.LIGHT}
        renderingType={RenderingType.VECTOR}
        gestureHandling={"auto"}
        disableDefaultUI={true}
        clickableIcons={false}
      >
        <AdvancedMarker key={lat} position={{ lat: lat, lng: long }}>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="default" className="aspect-square">
                <MapPinHouse />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full max-w-[300px] p-2 flex flex-col gap-1 z-99">
              <div className="w-full flex flex-row gap-1 items-center">
                <LocateFixedIcon className="min-w-4 w-4 h-4" />
                <p className="text-sm truncate grow">{street}</p>
              </div>
              <div className="w-full flex flex-row gap-1 items-center">
                <SquareArrowOutUpRightIcon className="w-4 h-4" />
                <Link
                  target="_blank"
                  href={`https://www.google.com/maps/place/${encodeURI(
                    street
                  )}`}
                >
                  Directions
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        </AdvancedMarker>
      </Map>
    </APIProvider>
  );
};
