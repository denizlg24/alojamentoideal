"use client";

import { TourItem } from "@/hooks/cart-context";
import { Card } from "../ui/card";
import Image from "next/image";
import { format } from "date-fns";
import { localeMap } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowUpRightFromSquareIcon } from "lucide-react";
import { categoriesMap } from "@/utils/bokun-requests";
export const ActivityOrderCard = ({ tourItem,reservation_id }: { tourItem: TourItem,reservation_id:string }) => {
  const locale = useLocale();
  const categoriesT = useTranslations("tourDisplay")
  const t = useTranslations("propertyCard")
  return (
    <Card className="w-full flex flex-col gap-3 relative p-4">
      <div className="w-full flex sm:flex-row flex-col items-start justify-between gap-3 relative ">
        <Image unoptimized 
          src={tourItem.photo}
          alt="cart-logo"
          width={1080}
          height={1080}
          className="w-full sm:max-w-[225px] h-auto aspect-video! max-h-[200px] object-cover rounded-lg"
        />
            <div className="w-full grow flex flex-col truncate gap-1">
          <div className="flex flex-col w-full gap-0">
            <h1 className="w-full font-semibold truncate">{tourItem.name}</h1>
            <h2 className="text-sm">
              {format(new Date(tourItem.selectedDate), "MMMM, dd yyyy", {
                locale: localeMap[locale as keyof typeof localeMap],
              })}
            </h2>
          </div>
          <Separator />
          <div className="flex flex-col">
            <p className="text-xs font-semibold">{t("activity_details")}</p>
            <div className="flex flex-row items-center gap-2 flex-wrap w-full">
            {Object.keys(tourItem.guests).map((categoryId) => {
              return <p className="text-xs" key={categoryId}>{categoriesT(categoriesMap[Number(categoryId)].title)}: <span className="font-semibold">{tourItem.guests[Number(categoryId)]}</span></p>
            })}
            </div>

          </div>
          <Separator />
          <Button className="h-fit! p-0 w-fit! px-3 rounded! py-1" asChild>
            <Link target="_blank" href={`/reservations/activities/${reservation_id}`}>
              {t("view-reservation-details")}
              <ArrowUpRightFromSquareIcon />
            </Link>
          </Button>
        </div>
      </div>
  
    </Card>
  );
};
