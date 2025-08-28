"use client";

import {
  CalendarIcon,
  CircleAlert,
  CircleMinus,
  CirclePlus,
  User,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { DateRange } from "react-day-picker";
import { useEffect, useState } from "react";
import { addMonths, format, isValid, parseISO } from "date-fns";
import { cn, localeMap } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export const FloatingFilter = ({ className }: { className?: string }) => {
  const locale = useLocale();
  const isMobile = useIsMobile();
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

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mobileCalendarOpen, setMobileCalendarOpen] = useState(false);
  const [mobileCalendarOpen1, setMobileCalendarOpen1] = useState(false);
  const [currentHref, updateHref] = useState("");
  useEffect(() => {
    const params = new URLSearchParams();

    if (date?.from) params.set("from", format(date.from, "yyyy-MM-dd"));
    if (date?.to) params.set("to", format(date.to, "yyyy-MM-dd"));

    params.set("adults", guests.adults.toString());
    params.set("children", guests.children.toString());
    params.set("infants", guests.infants.toString());
    params.set("pets", guests.pets.toString());

    updateHref(`?${params.toString()}`);
  }, [date, guests]);

  const searchParams = useSearchParams();

  useEffect(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const newFrom = fromParam ? parseISO(fromParam) : undefined;
    const newTo = toParam ? parseISO(toParam) : undefined;

    if (newFrom && isValid(newFrom) && newTo && isValid(newTo)) {
      setDate({
        to: newTo,
        from: newFrom,
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card
      className={cn(
        "w-full grid md:grid-cols-3 grid-cols-1 max-w-3xl mx-auto p-4 gap-2",
        className
      )}
    >
      {isMobile ? (
        <div className="col-span-full w-full flex flex-row items-center gap-2">
          <Dialog
            open={mobileCalendarOpen}
            onOpenChange={setMobileCalendarOpen}
          >
            <DialogTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "flex flex-1 grow sm:col-span-2 justify-start text-left font-normal",
                  !date?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  <>
                    {format(date.from, "LLL dd", {
                      locale: localeMap[locale as keyof typeof localeMap],
                    })}
                  </>
                ) : (
                  <span>{t("checkin")}</span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[300px] pt-6 gap-1">
              <DialogHeader>
                <DialogTitle>{t("checkin")}</DialogTitle>
                <DialogDescription className="hidden">
                  Check-in date
                </DialogDescription>
              </DialogHeader>
              <Calendar
                showOutsideDays={false}
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
                  setMobileCalendarOpen(false);
                }}
                numberOfMonths={1}
              />
            </DialogContent>
          </Dialog>
          {date?.from && (
            <>
              <p>-</p>
              <Dialog
                open={mobileCalendarOpen1}
                onOpenChange={setMobileCalendarOpen1}
              >
                <DialogTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "flex flex-1 grow sm:col-span-2 col-span-1 justify-start text-left font-normal",
                      !date?.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.to ? (
                      <>
                        {format(date.to, "LLL dd", {
                          locale: localeMap[locale as keyof typeof localeMap],
                        })}
                      </>
                    ) : (
                      <span>{t("checkout")}</span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[300px] pt-6 gap-1">
                  <DialogHeader>
                    <DialogTitle>{t("checkout")}</DialogTitle>
                    <DialogDescription className="hidden">
                      Check-out date
                    </DialogDescription>
                  </DialogHeader>
                  <Calendar
                    showOutsideDays={false}
                    startMonth={addMonths(date.from, 1)}
                    locale={localeMap[locale as keyof typeof localeMap]}
                    mode="single"
                    disabled={(date) =>
                      date < new Date(new Date().toDateString())
                    }
                    today={undefined}
                    defaultMonth={date?.to}
                    selected={date?.to}
                    onSelect={(e) => {
                      setDate((prev) => {
                        return { from: prev?.from, to: e };
                      });
                      setMobileCalendarOpen1(false);
                    }}
                    numberOfMonths={1}
                  />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      ) : (
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                    {format(date.from, "LLL dd", {
                      locale: localeMap[locale as keyof typeof localeMap],
                    })}{" "}
                    -{" "}
                    {format(date.to, "LLL dd", {
                      locale: localeMap[locale as keyof typeof localeMap],
                    })}
                  </>
                ) : (
                  format(date.from, "LLL dd", {
                    locale: localeMap[locale as keyof typeof localeMap],
                  })
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
            className="w-auto overflow-hidden p-1 z-99 relative flex flex-col gap-0"
            align="start"
          >
            <Calendar
              locale={localeMap[locale as keyof typeof localeMap]}
              mode="range"
              showOutsideDays={false}
              disabled={(date) => date < new Date(new Date().toDateString())}
              today={undefined}
              defaultMonth={date?.from}
              selected={date}
              onSelect={(range) => {
                if (range?.from && range?.to && range.to != range.from) {
                  setDate(range);
                  setCalendarOpen(false);
                } else {
                  if (range?.from) {
                    setDate((prev) => {
                      return { ...prev, from: range.from };
                    });
                  } else if (range?.to) {
                    setDate((prev) => {
                      return { from: prev?.from, to: range.from };
                    });
                    setCalendarOpen(false);
                  }
                }
              }}
              numberOfMonths={2}
            />
            <Button
              onClick={() => {
                setDate(undefined);
              }}
              className="mt-1 ml-1 py-1! px-2! h-fit"
              variant="ghost"
            >
              <X className="text-foreground" />
              {t("clear")}
            </Button>
          </PopoverContent>
        </Popover>
      )}
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
                      children: prev.children > 0 ? prev.children - 1 : 0,
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
                      infants: prev.infants > 0 ? prev.infants - 1 : 0,
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
              {isMobile ? (
                <Popover>
                  <PopoverTrigger>
                    <CircleAlert className=" w-4 h-4" />
                  </PopoverTrigger>
                  <PopoverContent className="z-99 text-sm p-2 w-fit">
                    {t("pets-warning")}
                  </PopoverContent>
                </Popover>
              ) : (
                <HoverCard>
                  <HoverCardTrigger>
                    <CircleAlert className=" w-4 h-4" />
                  </HoverCardTrigger>
                  <HoverCardContent className="z-99 text-sm p-2 w-fit">
                    {t("pets-warning")}
                  </HoverCardContent>
                </HoverCard>
              )}
            </div>
            <div className="w-full flex flex-row justify-between items-center col-span-3">
              <Button
                onClick={() => {
                  updateGuests((prev) => {
                    return {
                      ...prev,
                      pets: prev.pets > 0 ? prev.pets - 1 : 0,
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
        <Link href={"/rooms" + currentHref}>
          <>{t("search")}</>
        </Link>
      </Button>
    </Card>
  );
};
