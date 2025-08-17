"use client";

import { CustomFieldType } from "@/schemas/custom-field.schema";
import { FullListingType } from "@/schemas/full-listings.schema";
import { ReservationType } from "@/schemas/reservation.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { useEffect, useState } from "react";
import { PropertyInfoCard } from "../orders/property-info-card";
import Image from "next/image";
import planeFlyingGif from "@/public/plane_flying_gif.gif";
import { useTranslations } from "next-intl";

export const ReservationInfoProvider = ({
  reservation_id,
}: {
  reservation_id: string;
}) => {
  const t = useTranslations("propertyCard");
  const [customFields, setCustomFields] = useState<CustomFieldType[]>([]);
  const [listing, setListing] = useState<FullListingType | undefined>(
    undefined
  );
  const [reservation, setReservation] = useState<ReservationType | undefined>(
    undefined
  );

  const [thread, setThread] = useState<
    | {
        success: boolean;
        thread: { id: string; channel_unread: number };
        messages: {
          id: number;
          target_id: number;
          message: string;
          notes: string | null;
          created: string;
          image: string | null;
          guest_name: string;
          guest_thumb: string;
          is_sms: number;
          is_automatic: number;
          pinned: number;
          avatar: string | null;
          guest_id: number;
        }[];
      }
    | undefined
  >();

  const guestInfoCustomField = customFields?.find(
    (a) => a.name == "hostkit_url"
  );
  const guestInfoCustomDoneField = customFields?.find(
    (b) => b.name == "hostkit_done"
  );

  const getReservationCustomFields = async (rId: string) => {
    const custom_fields_response = await hostifyRequest<{
      success: boolean;
      custom_fields: CustomFieldType[];
    }>(`reservations/custom_fields/${rId}`, "GET");
    if (
      custom_fields_response.success &&
      custom_fields_response.custom_fields
    ) {
      return custom_fields_response.custom_fields;
    } else {
      return undefined;
    }
  };

  const getReservationInfo = async (rId: string) => {
    const info = await hostifyRequest<{ reservation: ReservationType }>(
      `reservations/${rId}`,
      "GET",
      undefined,
      undefined,
      undefined
    );
    if (info.reservation) {
      return info.reservation;
    } else {
      return undefined;
    }
  };

  const getListingInfo = async (listing_id: number) => {
    const info = await hostifyRequest<FullListingType>(
      `listings/${listing_id}`,
      "GET",
      [{ key: "include_related_objects", value: 1 }],
      undefined,
      undefined
    );
    if (info.success) {
      return info;
    } else {
      return undefined;
    }
  };

  const getThread = async (message_id: number) => {
    const info = await hostifyRequest<{
      success: boolean;
      thread: { id: string; channel_unread: number };
      messages: {
        id: number;
        target_id: number;
        message: string;
        notes: string | null;
        created: string;
        image: string | null;
        guest_name: string;
        guest_thumb: string;
        is_sms: number;
        is_automatic: number;
        pinned: number;
        avatar: string | null;
        guest_id: number;
      }[];
    }>(`inbox/${message_id}`, "GET");
    if (info.success) {
      return info;
    } else {
      return undefined;
    }
  };

  useEffect(() => {
    const getReservationWrapper = async () => {
      const reservationInfo = await getReservationInfo(reservation_id);
      if (reservationInfo) {
        setReservation(reservationInfo);
        const [listingInfo, custom_fields, thread] = await Promise.all([
          getListingInfo(reservationInfo.listing_id),
          getReservationCustomFields(reservation_id),
          getThread(reservationInfo.message_id),
        ]);
        setListing(listingInfo);
        setCustomFields(custom_fields ?? []);
        setThread(thread);
      }
    };
    if (reservation_id) {
      getReservationWrapper();
    }
  }, [reservation_id]);

  useEffect(() => {
    const refreshCustomFields = async () => {
      const custom_fields = await getReservationCustomFields(reservation_id);
      if (custom_fields) {
        setCustomFields(custom_fields);
      }
    };
    let interval: NodeJS.Timeout;

    const shouldntContinue =
      guestInfoCustomField?.value && guestInfoCustomDoneField?.value;
    if (!shouldntContinue) {
      refreshCustomFields();
      interval = setInterval(refreshCustomFields, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [guestInfoCustomField, guestInfoCustomDoneField, reservation_id]);

  const getThreadWrapper = async (id: number) => {
    const thread = await getThread(id);
    setThread(thread);
  };

  if (!listing || !reservation) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 flex flex-col pt-12">
        <Image
          src={planeFlyingGif}
          alt="Plane flying gif"
          className="w-full max-w-3xs mx-auto object-contain h-auto rounded-xl"
        />
        <h1 className="text-base text-center w-full font-semibold mt-6">
          {t("loading-reservation")}
          <span
            style={{
              display: "inline-block",
              animation: "blink 1.5s infinite steps(1, end)",
            }}
          >
            .
          </span>
          <span
            style={{
              display: "inline-block",
              animation: "blink 1.5s infinite steps(1, end)",
              animationDelay: "0.3s",
            }}
          >
            .
          </span>
          <span
            style={{
              display: "inline-block",
              animation: "blink 1.5s infinite steps(1, end)",
              animationDelay: "0.6s",
            }}
          >
            .
          </span>
        </h1>
      </div>
    );
  }

  return (
    <div className="w-full px-4 max-w-7xl mx-auto pt-12 flex flex-col gap-4">
      <h1 className="md:text-xl sm:text-lg text-base font-semibold">
        {t("confirmation-code")}: {reservation.confirmation_code}
      </h1>
      <PropertyInfoCard
        listing={listing}
        refreshMessages={() => {
          getThreadWrapper(reservation.message_id);
        }}
        reservation={reservation}
        setReservation={setReservation}
        custom_fields={customFields}
        thread={thread}
        setThread={setThread}
      />
    </div>
  );
};
