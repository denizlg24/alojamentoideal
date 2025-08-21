"use client";

import { cancelReservation } from "@/app/actions/cancelReservation";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { CustomFieldType } from "@/schemas/custom-field.schema";
import { ReservationType } from "@/schemas/reservation.schema";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export const GetReservationStatus = ({
  reservation,
  guestInfoCustomField,
  guestInfoCustomDoneField,
  transaction_id,
}: {
  reservation: ReservationType;
  guestInfoCustomField: CustomFieldType | undefined;
  guestInfoCustomDoneField: CustomFieldType | undefined;
  transaction_id: string;
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  if (reservation.status == "accepted") {
    if (guestInfoCustomField?.value && guestInfoCustomDoneField?.value) {
      if (guestInfoCustomDoneField.value === "false") {
        return (
          <div className="flex flex-row items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
            <p className="text-xs font-semibold">Waiting Hostkit.</p>
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
        <div className="flex flex-row items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-green-600"></div>
          <p className="text-xs font-semibold">Accepted</p>
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
      <div className="flex flex-row items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
        <p className="text-xs font-semibold">Waiting Hostkit.</p>
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
      <div className="flex flex-row items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
        <p className="text-xs font-semibold">Pending.</p>
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
      <div className="flex flex-row items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-600"></div>
        <p className="text-xs font-semibold">Waiting payment.</p>
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
      <div className="flex flex-row items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-red-600"></div>
        <p className="text-xs font-semibold">Canceled</p>
      </div>
    );
  }
  return <></>;
};
