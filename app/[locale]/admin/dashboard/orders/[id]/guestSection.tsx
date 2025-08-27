"use client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { localeMap } from "@/lib/utils";
import { IGuestDataDocument } from "@/models/GuestData";
import { ReservationType } from "@/schemas/reservation.schema";
import { CheckCircle, Clock, CircleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getGuestData } from "@/app/actions/getGuestData";
import { callHostkitAPI } from "@/app/actions/callHostkitApi";
import { Country } from "react-phone-number-input";
import { alpha3ToAlpha2 } from "i18n-iso-countries";
import flags from "react-phone-number-input/flags";

const FlagComponent = ({
  country,
  countryName,
}: {
  country: Country;
  countryName: string;
}) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 shrink-0 overflow-hidden rounded-xs bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export const GetGuestSection = ({
  reservation,
}: {
  reservation: ReservationType;
}) => {
  const [guestInfoCustomDoneField, setGuestInfoDone] = useState<
    "done" | "pending" | "failed" | false
  >(false);

  const [guest_data, setGuestData] = useState<IGuestDataDocument | undefined>(
    undefined
  );

  const [loadingHostkit, loadHostkit] = useState(true);

  useEffect(() => {
    const getCheckInDone = async () => {
      loadHostkit(true);
      const data = await callHostkitAPI<{
        short_link: string;
        status?: "done";
      }>({
        listingId: reservation.listing_id.toString(),
        endpoint: "getOnlineCheckin",
        query: { rcode: reservation.confirmation_code },
      });
      const data2 = await getGuestData(
        reservation.confirmation_code,
        reservation.listing_id.toString()
      );
      if (data2) {
        setGuestData(data2 as IGuestDataDocument);
        if (data2.synced) {
          if (data2.succeeded) {
            if (data && data.status) {
              setGuestInfoDone("done");
            }
          } else {
            setGuestInfoDone("failed");
          }
        } else {
          if (data2.guest_data.length === reservation.guests) {
            setGuestInfoDone("pending");
          } else {
            setGuestInfoDone(false);
          }
        }
      }
      loadHostkit(false);
    };
    if (reservation.confirmation_code) getCheckInDone();
  }, [reservation]);

  const t = useTranslations("propertyCard");
  const locale = useLocale();

  if (loadingHostkit || !guest_data || !reservation) {
    return (
      <div className="w-full flex flex-col gap-1 mt-4 col-span-1">
        <Skeleton className="w-[80%] max-w-[250px] h-4" />
      </div>
    );
  }
  if (!guest_data || !guestInfoCustomDoneField) {
    return (
      <div className="w-full flex flex-col gap-1 mt-4 col-span-1">
        <p className="md:text-sm text-xs font-semibold">
          Guest information not provided yet.
        </p>
      </div>
    );
  }
  if (guestInfoCustomDoneField === "done") {
    return (
      <div className="w-full flex flex-col gap-1 mt-4 col-span-1">
        <p className="md:text-sm text-xs font-semibold">{t("whos-coming")}</p>
        <p className="text-xs text-muted-foreground mb-2">
          Hostkit synced and verified.
        </p>
        <div className="w-full flex flex-row items-center gap-2 flex-wrap justify-start">
          {guest_data?.guest_data.map((guest) => {
            return (
              <Card
                key={guest.document_number}
                className="p-2 rounded flex flex-col gap-1 relative"
              >
                <div className="w-full flex flex-row items-center gap-1">
                  <FlagComponent
                    country={alpha3ToAlpha2(guest.document_country) as Country}
                    countryName={guest.document_country}
                  />
                  <p className="font-bold text-sm truncate grow">
                    {guest.first_name} {guest.last_name}
                  </p>
                </div>

                <p className="text-muted-foreground text-xs">
                  {guest.document_number}
                </p>
                <p className="text-muted-foreground text-xs">
                  {format(new Date(guest.birthday), "dd MMM yyyy", {
                    locale: localeMap[locale as keyof typeof localeMap],
                  })}
                </p>
                <CheckCircle className="text-green-600 absolute -right-2 -top-2 w-4! h-4!" />
              </Card>
            );
          })}
        </div>
      </div>
    );
  }
  if (guestInfoCustomDoneField == "pending") {
    return (
      <div className="w-full flex flex-col gap-1 mt-4 col-span-1">
        <p className="md:text-sm text-xs font-semibold">{t("whos-coming")}</p>
        <p className="text-xs text-muted-foreground mb-2">
          Guest data provided but not synced yet.
        </p>
        <div className="w-full flex flex-row items-center gap-2 flex-wrap justify-start">
          {guest_data?.guest_data.map((guest) => {
            return (
              <Card
                key={guest.document_number}
                className="p-2 rounded flex flex-col gap-1 relative"
              >
                <div className="w-full flex flex-row items-center gap-1">
                  <FlagComponent
                    country={alpha3ToAlpha2(guest.document_country) as Country}
                    countryName={guest.document_country}
                  />
                  <p className="font-bold text-sm truncate grow">
                    {guest.first_name} {guest.last_name}
                  </p>
                </div>

                <p className="text-muted-foreground text-xs">
                  {guest.document_number}
                </p>
                <p className="text-muted-foreground text-xs">
                  {format(new Date(guest.birthday), "dd MMM yyyy", {
                    locale: localeMap[locale as keyof typeof localeMap],
                  })}
                </p>
                <Clock className="text-yellow-600 absolute -right-2 -top-2 w-4! h-4!" />
              </Card>
            );
          })}
        </div>
      </div>
    );
  }
  if (guestInfoCustomDoneField == "failed") {
    return (
      <div className="w-full flex flex-col gap-1 mt-4 col-span-1">
        <p className="md:text-sm text-xs font-semibold">{t("whos-coming")}</p>
        <p className="text-xs text-muted-foreground mb-2">
          Guest data provided and synced but not verified.{" "}
          <span className="font-bold">Advice guest ASAP!</span>
        </p>
        <div className="w-full flex flex-row items-center gap-2 flex-wrap justify-start">
          {guest_data?.guest_data.map((guest) => {
            return (
              <Card
                key={guest.document_number}
                className="p-2 rounded flex flex-col gap-1 relative"
              >
                <div className="w-full flex flex-row items-center gap-1">
                  <FlagComponent
                    country={alpha3ToAlpha2(guest.document_country) as Country}
                    countryName={guest.document_country}
                  />
                  <p className="font-bold text-sm truncate grow">
                    {guest.first_name} {guest.last_name}
                  </p>
                </div>

                <p className="text-muted-foreground text-xs">
                  {guest.document_number}
                </p>
                <p className="text-muted-foreground text-xs">
                  {format(new Date(guest.birthday), "dd MMM yyyy", {
                    locale: localeMap[locale as keyof typeof localeMap],
                  })}
                </p>
                <CircleAlert className="text-red-600 absolute -right-2 -top-2 w-4! h-4!" />
              </Card>
            );
          })}
        </div>
      </div>
    );
  }
  return <></>;
};
