import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { localeMap } from "@/lib/utils";
import { CustomFieldType } from "@/schemas/custom-field.schema";
import { ListingType } from "@/schemas/listing.schema";
import { ReservationType } from "@/schemas/reservation.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { format } from "date-fns";
import {
  Baby,
  ChevronLeft,
  SquareArrowOutUpRight,
  User,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MdOutlineChildCare } from "react-icons/md";

export const ChatInfo = async ({
  reservationId,
  locale,
}: {
  reservationId: string;
  locale: string;
}) => {
  const [reservationInfo, customFields] = await Promise.all([
    hostifyRequest<{
      reservation: ReservationType;
    }>(`reservations/${reservationId}`, "GET", undefined, undefined, undefined),
    hostifyRequest<{
      success: boolean;
      custom_fields: CustomFieldType[];
    }>(`reservations/custom_fields/${reservationId}`, "GET"),
  ]);
  const checkingT = await getTranslations("propertyCard");

  const guestInfoCustomField = customFields.custom_fields.find(
    (a) => a.name == "hostkit_url"
  );
  const guestInfoCustomDoneField = customFields.custom_fields.find(
    (b) => b.name == "hostkit_done"
  );

  const listingInfo = await hostifyRequest<{ listing: ListingType }>(
    `listings/${reservationInfo.reservation.listing_id}`,
    "GET"
  );

  const getReservationStatus = (
    reservation: ReservationType,
    guestInfoCustomField: CustomFieldType | undefined,
    guestInfoCustomDoneField: CustomFieldType | undefined
  ) => {
    if (reservation.status == "accepted") {
      if (guestInfoCustomField?.value && guestInfoCustomDoneField?.value) {
        if (guestInfoCustomDoneField.value === "false") {
          return (
            <div className="flex flex-row items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
              <p className="text-xs font-semibold">Waiting Hostkit.</p>
            </div>
          );
        }
        return (
          <div className="flex flex-row items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-green-600"></div>
            <p className="text-xs font-semibold">Accepted</p>
          </div>
        );
      }
      return (
        <div className="flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
          <p className="text-xs font-semibold">Waiting Hostkit.</p>
        </div>
      );
    }
    if (reservation.status == "pending") {
      return (
        <div className="flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
          <p className="text-xs font-semibold">Pending.</p>
        </div>
      );
    }
    if (reservation.status == "awaiting_payment") {
      return (
        <div className="flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
          <p className="text-xs font-semibold">Waiting payment.</p>
        </div>
      );
    }

    if (
      reservation.status == "cancelled" ||
      reservation.status == "denied" ||
      reservation.status == "deleted"
    ) {
      return (
        <div className="flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-600"></div>
          <p className="text-xs font-semibold">Canceled</p>
        </div>
      );
    }
    return <></>;
  };

  return (
    <div className="w-full flex min-[525px]:flex-row flex-col gap-2 justify-between min-[525px]:items-end items-stretch">
      <div className="min-[525px]:w-fit w-full flex flex-col gap-2">
        <Button
          variant={"link"}
          asChild
          className="text-xs! h-fit! p-0! text-primary-foreground text-left justify-start"
        >
          <Link href={"?chat_id="}>
            <ChevronLeft /> Back
          </Link>
        </Button>
        <div className="p-1 px-3 bg-muted rounded-lg shadow flex flex-col justify-start">
          <p className="text-xs font-bold">{listingInfo.listing.name}</p>
          {getReservationStatus(
            reservationInfo.reservation,
            guestInfoCustomField,
            guestInfoCustomDoneField
          )}
        </div>
        <div className="gap-8 p-1 px-3 bg-muted rounded-lg shadow grid grid-cols-2 relative h-fit!">
          <div className="col-span-1 flex flex-col">
            <p className="text-sm font-medium">{checkingT("arriving")}</p>
            <p className="text-xs font-normal">
              {format(
                new Date(reservationInfo.reservation.checkIn),
                "EEE, MMM dd",
                {
                  locale: localeMap[locale as keyof typeof localeMap],
                }
              )}
            </p>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 h-[60%] w-[0.5px] bg-muted-foreground/50 top-1/2 -translate-y-1/2"></div>
          <div className="col-span-1 flex flex-col text-right">
            <p className="text-sm font-medium">{checkingT("leaving")}</p>
            <p className="text-xs font-normal">
              {format(
                new Date(reservationInfo.reservation.checkOut),
                "EEE, MMM dd",
                {
                  locale: localeMap[locale as keyof typeof localeMap],
                }
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 justify-stretch min-[525px]:w-fit w-full">
        <div className="w-full flex flex-row gap-2 min-[525px]:justify-start justify-stretch">
          <div className="min-[525px]:w-auto w-full flex flex-col gap-2">
            <div className="gap-2 flex flex-row p-1 px-3 bg-muted rounded-lg shadow min-[525px]:w-auto w-full">
              <p className="text-sm font-medium flex flex-row items-center gap-1">
                <Users className="w-3 h-3 shrink-0 aspect-square" />
                Guests:
              </p>
              <p className="text-sm font-normal">
                {reservationInfo.reservation.guests}
              </p>
            </div>
            <div className="gap-1 flex flex-row p-1 px-3 bg-muted rounded-lg shadow min-[525px]:w-auto w-full">
              <p className="text-sm font-medium flex flex-row items-center gap-1">
                <User className="w-3 h-3 shrink-0 aspect-square" />
                Adults:
              </p>
              <p className="text-sm font-normal">
                {reservationInfo.reservation.adults ?? 0}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 justify-stretch min-[525px]:w-auto w-full">
            <div className="gap-1 flex flex-row p-1 px-3 bg-muted rounded-lg shadow min-[525px]:w-auto w-full">
              <p className="text-sm font-medium flex flex-row items-center gap-1">
                <MdOutlineChildCare className="w-3 h-3 shrink-0 aspect-square" />
                Children:
              </p>
              <p className="text-sm font-normal">
                {reservationInfo.reservation.children ?? 0}
              </p>
            </div>
            <div className="gap-1 flex flex-row p-1 px-3 bg-muted rounded-lg shadow min-[525px]:w-auto w-full">
              <p className="text-sm font-medium flex flex-row items-center gap-1">
                <Baby className="w-3 h-3 shrink-0 aspect-square" />
                Infants:
              </p>
              <p className="text-sm font-normal">
                {reservationInfo.reservation.infants ?? 0}
              </p>
            </div>
          </div>
        </div>

        <a
          href={`https://go.hostify.com/reservations/view/${reservationId}`}
          target="_blank"
          className="gap-2 items-center flex flex-row p-1 px-3 bg-muted rounded-lg shadow"
        >
          <p className="text-sm font-medium">Booking Code:</p>
          <p className="text-xs font-normal">
            {reservationInfo.reservation.confirmation_code}
          </p>
          <SquareArrowOutUpRight className="shrink-0 w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
