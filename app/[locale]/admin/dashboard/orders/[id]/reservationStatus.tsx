"use client";
import { cancelReservation } from "@/app/actions/cancelReservation";
import { CancelBookingButton } from "@/components/orders/cancel-booking-button";
import { getRefundPercentage } from "@/components/orders/property-info-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { ReservationType } from "@/schemas/reservation.schema";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export const GetReservationStatus = ({
  reservation,
  transaction_id,
  order_id,
  guestInfoCustomDoneField,
  createdAt,
}: {
  reservation: ReservationType;
  order_id: string;
  transaction_id: string;
  guestInfoCustomDoneField: "done" | "pending" | "failed" | false;
  createdAt: Date;
}) => {
  const [loading, setLoading] = useState(false);

  const t = useTranslations("propertyCard");
  const router = useRouter();

  if (!reservation) {
    return (
      <div className="w-full flex flex-row items-center gap-2">
        <Skeleton className="h-2.5 w-2.5 rounded-full" />
        <Skeleton className="w-[80%] max-w-[200px] h-5" />
      </div>
    );
  }
  const refund = getRefundPercentage(
    createdAt,
    new Date(reservation.checkIn),
    new Date()
  );

  if (reservation.status == "accepted") {
    if (!guestInfoCustomDoneField) {
      return (
        <div className="w-full flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
          <p className="text-xs font-semibold">{t("waiting-for-guest-data")}</p>
          <CancelBookingButton
            refundPercentage={refund}
            reservation_id={reservation.id}
            productConfirmationCode={reservation.confirmation_code}
            order_id={order_id}
          />
        </div>
      );
    }
    if (guestInfoCustomDoneField == "pending") {
      return (
        <div className="w-full flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
          <p className="text-xs font-semibold">{t("verifying-guest-data")}</p>
          <CancelBookingButton
            refundPercentage={refund}
            reservation_id={reservation.id}
            productConfirmationCode={reservation.confirmation_code}
            order_id={order_id}
          />
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
                reservation.confirmation_code,
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
        <CancelBookingButton
          refundPercentage={refund}
          reservation_id={reservation.id}
          productConfirmationCode={reservation.confirmation_code}
          order_id={order_id}
        />
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
            await cancelReservation(
              reservation.id.toString(),
              reservation.confirmation_code,
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
            await cancelReservation(
              reservation.id.toString(),
              reservation.confirmation_code,
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
