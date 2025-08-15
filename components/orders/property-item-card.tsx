"use client";
import { AccommodationItem } from "@/hooks/cart-context";
import { useLocale, useTranslations } from "next-intl";
import { Separator } from "../ui/separator";
import { format } from "date-fns";
import { localeMap } from "@/lib/utils";
import Image from "next/image";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowUpRightFromSquareIcon } from "lucide-react";
export const PropertyItemCard = ({
  item,
  start_date,
  end_date,
  adults,
  children_,
  infants,
  photo,
  reservation_id,
}: {
  item: AccommodationItem;
  start_date: string;
  end_date: string;
  adults: number;
  children_: number;
  infants: number;
  photo: string;
  reservation_id: string;
}) => {
  const locale = useLocale();
  const t = useTranslations("propertyCard");
  return (
    <Card className="w-full flex flex-col gap-3 relative p-4">
      <div className="w-full flex sm:flex-row flex-col items-start justify-between gap-3 relative ">
        <Image
          src={photo}
          alt="cart-logo"
          width={1080}
          height={1080}
          className="w-full sm:max-w-[225px] h-auto aspect-video! max-h-[200px] object-cover rounded-lg"
        />
        <div className="w-full grow flex flex-col truncate gap-1">
          <div className="flex flex-col w-full gap-0">
            <h1 className="w-full font-semibold truncate">{item.name}</h1>
            <h2 className="text-sm">
              {format(new Date(start_date), "MMM, dd", {
                locale: localeMap[locale as keyof typeof localeMap],
              })}{" "}
              -{" "}
              {format(new Date(end_date), "MMM, dd", {
                locale: localeMap[locale as keyof typeof localeMap],
              })}
            </h2>
          </div>
          <Separator />
          <div className="flex flex-col">
            <p className="text-xs font-semibold">{t("trip_details")}</p>
            <p className="text-xs">
              {t("nights", {
                count:
                  (new Date(end_date).getTime() -
                    new Date(start_date).getTime()) /
                  (1000 * 60 * 60 * 24),
                adults: adults,
                children:
                  children_ > 0 ? t("children_text", { count: children_ }) : "",
                infants:
                  infants > 0 ? t("infants_text", { count: infants }) : "",
              })}
            </p>
          </div>
          <Separator />
          <Button className="h-fit! p-0 w-fit! px-3 rounded! py-1" asChild>
            <Link target="_blank" href={`/reservations/${reservation_id}`}>
              {t("view-reservation-details")}
              <ArrowUpRightFromSquareIcon />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
};
