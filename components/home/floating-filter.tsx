"use client";

import {
  CalendarIcon,
  CircleAlert,
  CircleMinus,
  CirclePlus,
  User,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { DateRange } from "react-day-picker";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";

import { pt, enUS, es } from "date-fns/locale";
import { useTranslations } from "next-intl";

export const FloatingFilter = ({ locale }: { locale: string }) => {
  const localeMap = {
    en: enUS,
    pt: pt,
    es: es,
  };
  const t = useTranslations("floating-filter");
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

  const [currentHref, updateHref] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();

    if (date?.from) params.set("from", date.from.toISOString().split("T")[0]);
    if (date?.to) params.set("to", date.to.toISOString().split("T")[0]);

    params.set("adults", guests.adults.toString());
    params.set("children", guests.children.toString());
    params.set("infants", guests.infants.toString());
    params.set("pets", guests.pets.toString());

    updateHref(`?${params.toString()}`);
  }, [date, guests]);

  return (
    <Card className="w-full grid md:grid-cols-3 sm:grid-cols-5 grid-cols-1 max-w-3xl mx-auto p-4 gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "md:flex hidden w-full col-span-1 justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}
                </>
              ) : (
                format(date.from, "LLL dd")
              )
            ) : (
              <span>
                {t("checkin")} - {t("checkout")}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          className="w-auto overflow-hidden p-0 z-99"
          align="start"
        >
          <Calendar
            locale={localeMap[locale as keyof typeof localeMap]}
            mode="range"
            disabled={(date) => date < new Date(new Date().toDateString())}
            today={undefined}
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "md:hidden flex w-full sm:col-span-2 justify-start text-left font-normal",
              !date?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              <>{format(date.from, "LLL dd")}</>
            ) : (
              <span>{t("checkin")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          className="w-auto overflow-hidden p-0 z-99"
          align="start"
        >
          <Calendar
            locale={localeMap[locale as keyof typeof localeMap]}
            mode="single"
            disabled={(date) => date < new Date(new Date().toDateString())}
            today={undefined}
            defaultMonth={date?.from}
            selected={date?.from}
            onSelect={(e) => {
              setDate((prev) => {
                return { from: e, to: prev?.to };
              });
            }}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "md:hidden flex w-full sm:col-span-2 col-span-1 justify-start text-left font-normal",
              !date?.to && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.to ? (
              <>{format(date.to, "LLL dd")}</>
            ) : (
              <span>{t("checkout")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          className="w-auto overflow-hidden p-0 z-99"
          align="start"
        >
          <Calendar
            locale={localeMap[locale as keyof typeof localeMap]}
            mode="single"
            disabled={(date) => date < new Date(new Date().toDateString())}
            today={undefined}
            defaultMonth={date?.to}
            selected={date?.to}
            onSelect={(e) => {
              setDate((prev) => {
                return { from: prev?.from, to: e };
              });
            }}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="guests"
            variant={"outline"}
            className="w-full col-span-1 justify-start text-left font-normal"
          >
            <User />
            {guests.adults + guests.children}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          className="w-[300px] overflow-hidden p-4 z-99 flex flex-col gap-3"
          align="start"
        >
          <div className="grid grid-cols-5 w-full items-center">
            <div className="flex flex-col items-start col-span-2">
              <p className="text-sm">{t("adults")}</p>
              <p className="text-xs text-muted-foreground">{t("ages")} 13+</p>
            </div>
            <div className="w-full flex flex-row justify-between items-center col-span-3">
              <Button
                onClick={() => {
                  updateGuests((prev) => {
                    return {
                      ...prev,
                      adults: prev.adults - 1 > 0 ? prev.adults - 1 : 1,
                    };
                  });
                }}
                variant="ghost"
              >
                <CircleMinus />
              </Button>
              <p className="text-sm">{guests.adults}</p>
              <Button
                onClick={() => {
                  updateGuests((prev) => {
                    return {
                      ...prev,
                      adults: prev.adults + 1 < 21 ? prev.adults + 1 : 20,
                    };
                  });
                }}
                variant="ghost"
              >
                <CirclePlus />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-5 w-full items-center">
            <div className="flex flex-col items-start col-span-2">
              <p className="text-sm">{t("children")}</p>
              <p className="text-xs text-muted-foreground">{t("ages")} 2-12</p>
            </div>
            <div className="w-full flex flex-row justify-between items-center col-span-3">
              <Button
                onClick={() => {
                  updateGuests((prev) => {
                    return {
                      ...prev,
                      children: prev.children - 1 > 0 ? prev.children - 1 : 1,
                    };
                  });
                }}
                variant="ghost"
              >
                <CircleMinus />
              </Button>
              <p className="text-sm">{guests.children}</p>
              <Button
                onClick={() => {
                  updateGuests((prev) => {
                    return {
                      ...prev,
                      children: prev.children + 1 < 21 ? prev.children + 1 : 20,
                    };
                  });
                }}
                variant="ghost"
              >
                <CirclePlus />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-5 w-full items-center">
            <div className="flex flex-col items-start col-span-2">
              <p className="text-sm">{t("infants")}</p>
              <p className="text-xs text-muted-foreground">
                {t("ages-under")} 2
              </p>
            </div>
            <div className="w-full flex flex-row justify-between items-center col-span-3">
              <Button
                onClick={() => {
                  updateGuests((prev) => {
                    return {
                      ...prev,
                      infants: prev.infants - 1 > 0 ? prev.infants - 1 : 1,
                    };
                  });
                }}
                variant="ghost"
              >
                <CircleMinus />
              </Button>
              <p className="text-sm">{guests.infants}</p>
              <Button
                onClick={() => {
                  updateGuests((prev) => {
                    return {
                      ...prev,
                      infants: prev.infants + 1 < 21 ? prev.infants + 1 : 20,
                    };
                  });
                }}
                variant="ghost"
              >
                <CirclePlus />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-5 w-full items-center">
            <div className="flex flex-row items-center justify-start gap-1 col-span-2">
              <p className="text-sm">{t("pets")}</p>
              <HoverCard>
                <HoverCardTrigger>
                  <CircleAlert className=" w-4 h-4" />
                </HoverCardTrigger>
                <HoverCardContent className="z-99 text-sm p-2 w-fit">
                  {t("pets-warning")}
                </HoverCardContent>
              </HoverCard>
            </div>
            <div className="w-full flex flex-row justify-between items-center col-span-3">
              <Button
                onClick={() => {
                  updateGuests((prev) => {
                    return {
                      ...prev,
                      pets: prev.pets - 1 > 0 ? prev.pets - 1 : 1,
                    };
                  });
                }}
                variant="ghost"
              >
                <CircleMinus />
              </Button>
              <p className="text-sm">{guests.pets}</p>
              <Button
                onClick={() => {
                  updateGuests((prev) => {
                    return {
                      ...prev,
                      pets: prev.pets + 1 < 21 ? prev.pets + 1 : 20,
                    };
                  });
                }}
                variant="ghost"
              >
                <CirclePlus />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Button asChild className="md:col-span-1 sm:col-span-5 col-span-1">
        <Link href={"/rooms" + currentHref}>{t("search")}</Link>
      </Button>
    </Card>
  );
};
