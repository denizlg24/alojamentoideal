"use client";
import { FullListingType } from "@/schemas/full-listings.schema";
import { ReservationType } from "@/schemas/reservation.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { useEffect, useState } from "react";
import { PropertyInfoCard } from "../orders/property-info-card";
import Image from "next/image";
import planeFlyingGif from "@/public/plane_flying_gif.gif";
import { useTranslations } from "next-intl";
import { getChatId } from "@/app/actions/getChatId";
import { syncAutomatedMessages } from "@/app/actions/syncAutomatedMessages";
import { IOrder } from "@/models/Order";
import { getOrderByReservationId } from "@/app/actions/getOrderByReference";
export const ReservationInfoProvider = ({
  reservation_id,
}: {
  reservation_id: string;
}) => {
  const t = useTranslations("propertyCard");
  const [listing, setListing] = useState<FullListingType | undefined>(
    undefined
  );
  const [reservation, setReservation] = useState<ReservationType | undefined>(
    undefined
  );
  const [order, setOrder] = useState<IOrder | undefined>(undefined);

  const [chat_id, setChatId] = useState("");

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

  useEffect(() => {
    const getReservationWrapper = async () => {
      const [reservationInfo, { order }] = await Promise.all([
        getReservationInfo(reservation_id),
        getOrderByReservationId(reservation_id),
      ]);
      if (order) {
        setOrder(order as IOrder);
      }
      if (reservationInfo) {
        const message_id = reservationInfo.message_id;
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
          if (reservationInfo.guest_id) {
            syncAutomatedMessages(
              reservationInfo.id.toString(),
              reservationInfo.guest_id.toString(),
              info.messages
            );
          }
        }
        setReservation(reservationInfo);
        const [listingInfo, chat_id] = await Promise.all([
          getListingInfo(reservationInfo.listing_id),
          getChatId(reservation_id),
        ]);
        setChatId(chat_id);
        setListing(listingInfo);
      }
    };
    if (reservation_id) {
      getReservationWrapper();
    }
  }, [reservation_id]);

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
        property={order?.items
          .filter((item) => item.type == "accommodation")
          .find((item) => item.property_id === listing.listing.id)}
        listing={listing}
        chat_id={chat_id}
        reservation={reservation}
      />
    </div>
  );
};
