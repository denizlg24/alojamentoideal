"use client";

import { callHostkitAPI } from "@/app/actions/callHostkitApi";
import { cancelReservation } from "@/app/actions/cancelReservation";
import { getGuestData } from "@/app/actions/getGuestData";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { IGuestDataDocument } from "@/models/GuestData";
import { ReservationType } from "@/schemas/reservation.schema";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export const GetReservationStatus = ({
  reservation,
  transaction_id,
}: {
  reservation: ReservationType;
  transaction_id: string;
}) => {
  const [loading, setLoading] = useState(false);

  const [guestInfoCustomDoneField, setGuestInfoDone] = useState<
    "done" | "pending" | "failed" | false
  >(false);
  const [, setGuestData] = useState<IGuestDataDocument | undefined>(undefined);
  const [loadingHostkit, loadHostkit] = useState(true);
  const t = useTranslations("propertyCard");
  const router = useRouter();

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

  if (!reservation) {
    return (
      <div className="w-full flex flex-row items-center gap-2">
        <Skeleton className="h-2.5 w-2.5 rounded-full" />
        <Skeleton className="w-[80%] max-w-[200px] h-5" />
      </div>
    );
  }
  if (reservation.status == "accepted") {
    if (loadingHostkit) {
      return (
        <div className="w-full flex flex-row items-center gap-2">
          <Skeleton className="h-2.5 w-2.5 rounded-full" />
          <Skeleton className="w-[80%] max-w-[200px] h-5" />
        </div>
      );
    }
    if (!guestInfoCustomDoneField) {
      return (
        <div className="w-full flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
          <p className="text-xs font-semibold">{t("waiting-for-guest-data")}</p>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await cancelReservation(
                reservation.id.toString(),
                transaction_id
              );
              router.refresh();
            }}
            className="h-fit! p-1! rounded!"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Canceling Order
              </>
            ) : (
              <>Cancel Order</>
            )}
          </Button>
        </div>
      );
    }
    if (guestInfoCustomDoneField == "pending") {
      return (
        <div className="w-full flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
          <p className="text-xs font-semibold">{t("verifying-guest-data")}</p>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await cancelReservation(
                reservation.id.toString(),
                transaction_id
              );
              router.refresh();
            }}
            className="h-fit! p-1! rounded!"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Canceling Order
              </>
            ) : (
              <>Cancel Order</>
            )}
          </Button>
        </div>
      );
    }
    if (guestInfoCustomDoneField == "failed") {
      return (
        <div className="w-full flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-600"></div>
          <p className="text-xs font-semibold">{t("failed-verification")}</p>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await cancelReservation(
                reservation.id.toString(),
                transaction_id
              );
              router.refresh();
            }}
            className="h-fit! p-1! rounded!"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Canceling Order
              </>
            ) : (
              <>Cancel Order</>
            )}
          </Button>
        </div>
      );
    }
    return (
      <div className="w-full flex flex-row items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-green-600"></div>
        <p className="text-xs font-semibold">{t("order-confirmed")}</p>
        <Button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            await cancelReservation(reservation.id.toString(), transaction_id);
            router.refresh();
          }}
          className="h-fit! p-1! rounded!"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Canceling Order
            </>
          ) : (
            <>Cancel Order</>
          )}
        </Button>
      </div>
    );
  }
  if (reservation.status == "pending") {
    return (
      <div className="w-full flex flex-row items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
        <p className="text-xs font-semibold">{t("reservation-pending")}</p>
        <Button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            await cancelReservation(reservation.id.toString(), transaction_id);
            router.refresh();
          }}
          className="h-fit! p-1! rounded!"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Canceling Order
            </>
          ) : (
            <>Cancel Order</>
          )}
        </Button>
      </div>
    );
  }
  if (reservation.status == "awaiting_payment") {
    return (
      <div className="w-full flex flex-row items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
        <p className="text-xs font-semibold">
          {t("reservation-waiting-payment")}
        </p>
        <Button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            await cancelReservation(reservation.id.toString(), transaction_id);
            router.refresh();
          }}
          className="h-fit! p-1! rounded!"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Canceling Order
            </>
          ) : (
            <>Cancel Order</>
          )}
        </Button>
      </div>
    );
  }

  if (
    reservation.status == "cancelled" ||
    reservation.status == "denied" ||
    reservation.status == "deleted"
  ) {
    return (
      <div className="w-full flex flex-row items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-red-600"></div>
        <p className="text-xs font-semibold">
          {t("reservation-canceled")}{" "}
          <span className="font-medium">
            ({reservation.status_description})
          </span>
        </p>
      </div>
    );
  }
  return <></>;
};
