import { getAdminOrder } from "@/app/actions/getAdminOrder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localeMap, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import { CustomFieldType } from "@/schemas/custom-field.schema";
import { ListingType } from "@/schemas/listing.schema";
import { ReservationType } from "@/schemas/reservation.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { format, fromUnixTime } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Landmark,
  LucideSquareArrowOutUpRight,
  RefreshCcw,
  Wallet,
  XCircle,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { GetReservationStatus } from "./reservationStatus";
import { Separator } from "@/components/ui/separator";
import Stripe from "stripe";
import { FaCcApplePay } from "react-icons/fa6";
import {
  PaymentIcon,
  PaymentTypeExtended,
} from "react-svg-credit-card-payment-icons";
import { GetGuestSection } from "./guestSection";
import { AttachInvoiceButton } from "./attachInvoiceButon";
import { IssueNoteButton } from "./issueNoteButton";
import { getGuestData } from "@/app/actions/getGuestData";
import { callHostkitAPI } from "@/app/actions/callHostkitApi";
import { IGuestDataDocument } from "@/models/GuestData";

export async function generateMetadata() {
  const t = await getTranslations("metadata");

  return {
    title: t("adminDashboard.title"),
    description: t("adminDashboard.description"),
    keywords: t("adminDashboard.keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      title: t("adminDashboard.title"),
      description: t("adminDashboard.description"),
      url: "https://alojamentoideal.pt/admin/dashboard/inbox",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("adminDashboard.title"),
      description: t("adminDashboard.description"),
    },
  };
}

const renderIcon = ({
  paymentMethod,
}: {
  paymentMethod: Stripe.Charge.PaymentMethodDetails | undefined;
}) => {
  if (!paymentMethod) return null;

  if (paymentMethod.type === "card")
    return (
      <PaymentIcon
        type={paymentMethod?.card?.brand as PaymentTypeExtended}
        format="flatRounded"
        className="w-8 h-auto shrink-0"
      />
    );
  if (paymentMethod.type === "sepa_debit")
    return <Landmark className="w-auto shrink-0 h-4" />;
  if (paymentMethod.type.includes("apple"))
    return <FaCcApplePay className="w-4 h-4 shrink-0" />;

  return <Wallet className="w-4 h-4 shrink-0" />;
};

const renderStatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "succeeded":
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case "pending":
      return <Clock className="w-5 h-5 text-yellow-600" />;
    case "failed":
      return <XCircle className="w-5 h-5 text-red-600" />;
    case "refunded":
      return <RefreshCcw className="w-5 h-5 text-blue-400" />;
    default:
      return <AlertTriangle className="w-5 h-5 text-gray-500" />;
  }
};

export default async function Home({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const propertyCardT = await getTranslations("propertyCard");
  const feeT = await getTranslations("feeTranslations");
  const t = await getTranslations("order");
  const order = await getAdminOrder(id);
  if (!order) {
    return;
  }
  const reservations = await Promise.all(
    order.reservationIds?.map(async (reservation_id) => {
      const [reservationInfo, customFields] = await Promise.all([
        hostifyRequest<{
          reservation: ReservationType;
        }>(
          `reservations/${reservation_id}`,
          "GET",
          undefined,
          undefined,
          undefined
        ),
        hostifyRequest<{
          success: boolean;
          custom_fields: CustomFieldType[];
        }>(`reservations/custom_fields/${reservation_id}`, "GET"),
      ]);

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

      const orderItem = order.items
        .filter((item) => item.type == "accommodation")[order.reservationIds.indexOf(reservationInfo.reservation.id.toString())]
      return {
        listing: listingInfo.listing,
        reservation: reservationInfo.reservation,
        orderItem,
        guestInfoCustomField,
        guestInfoCustomDoneField,
      };
    })
  );

  const getPaymentStatus = (charge: Stripe.Charge | undefined) => {
    let status = <></>;
    if (!charge) {
      return (
        <div className="flex flex-row items-center justify-start gap-1">
          <div className="w-2 h-2 rounded-full bg-destructive"></div>
          <p>No Charge</p>
        </div>
      );
    }
    switch (charge.status) {
      case "failed":
        status = (
          <div className="flex flex-row items-center justify-start gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive"></div>
            <p>Failed ({charge.failure_message})</p>
          </div>
        );
        break;
      case "pending":
        status = (
          <div className="flex flex-row items-center justify-start gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <p>Pending ({charge.amount / 100}€)</p>
          </div>
        );
        break;
      case "succeeded":
        status = (
          <div className="flex flex-row items-center justify-start gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <p>Succeeded ({charge.amount / 100}€)</p>
          </div>
        );
        break;
    }
    if (charge.amount_refunded > 0) {
      status = (
        <div className="flex flex-row items-center justify-start gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          <p>Refunded ({charge.amount_refunded / 100}€)</p>
        </div>
      );
    }
    return status;
  };

  const charge = order.payment_method_id.charge;

  return (
    <div className="flex flex-col w-full h-full bg-muted">
      <div className="w-full lg:grid lg:grid-cols-5 flex flex-col justify-start items-start gap-4 pt-4 px-4">
        <div className="flex flex-col gap-0 w-full col-span-full h-fit!">
          <div className="flex flex-row gap-2 items-center">
            <h1 className="lg:text-2xl md:text-xl text-lg font-bold">
              #{order.orderId}
            </h1>
            <Card className="p-1 rounded!">
              {getPaymentStatus(order.payment_method_id.charge)}
            </Card>
          </div>
          <h2 className="md:text-base text-sm font-medium">
            {format(order.createdAt, "MMM dd, yyyy - h:mm bbb")}
          </h2>
        </div>
        <div className="w-full col-span-2 flex flex-col gap-4 order-2">
          <Card className="px-4 flex flex-col gap-2">
            <div className="flex flex-row items-center justify-between text-sm w-full relative">
              <p className="font-bold">{t("order_id")}</p>
              <p className="font-normal max-w-[60%] truncate">
                #{order.orderId}
              </p>
            </div>
            <div className="col-span-3 w-full flex flex-col gap-4">
              <div className="flex flex-row items-center justify-between text-sm">
                <p className="font-bold">{t("created_at")}</p>
                <p className="">
                  {format(
                    new Date(order.createdAt),
                    "dd, MMMM yyyy - h:mm bbb",
                    {
                      locale: localeMap[locale as keyof typeof localeMap],
                    }
                  )}
                </p>
              </div>
              <Separator />
              <div className="flex sm:flex-row flex-col sm:gap-6 gap-2 items-start">
                <div className="w-full flex flex-col gap-2">
                  <p className="font-bold">{t("client_info")}</p>
                  <div className="flex flex-row items-center justify-between text-sm">
                    <p className="font-semibold">{t("name_on_order")}</p>
                    <p className="max-w-[60%] truncate">{order.name}</p>
                  </div>
                  <div className="flex flex-row items-center justify-between text-sm">
                    <p className="font-semibold">{t("email")}</p>
                    <p className="max-w-[60%] truncate">{order.email}</p>
                  </div>
                  <div className="flex flex-row items-center justify-between text-sm">
                    <p className="font-semibold">{t("phone")}</p>
                    <p className="max-w-[60%] truncate">{order.phoneNumber}</p>
                  </div>
                </div>
                <div className="w-full flex flex-col gap-2">
                  <p className="font-bold">{t("billing_info")}</p>
                  {order.companyName && (
                    <div className="flex flex-row items-center justify-between text-sm">
                      <p className="font-semibold text-left">
                        {t("company_name")}
                      </p>
                      <p className="max-w-[60%] truncate">
                        {order.companyName}
                      </p>
                    </div>
                  )}
                  {order.tax_number && (
                    <div className="flex flex-row items-center justify-between text-sm">
                      <p className="font-semibold text-left">{t("vat")}</p>
                      <p className="max-w-[60%] truncate">{order.tax_number}</p>
                    </div>
                  )}
                  <div className="flex flex-row items-start justify-between text-sm text-right">
                    <p className="font-semibold text-left">{t("address")}</p>
                    <p className="max-w-[60%] line-clamp-3">
                      {charge
                        ? `${charge?.billing_details.address?.line1 ?? ""}${
                            charge?.billing_details.address?.line2
                              ? ` ${charge?.billing_details.address?.line2}`
                              : ""
                          }, ${
                            charge?.billing_details.address?.postal_code ?? ""
                          } ${
                            charge?.billing_details.address?.state ||
                            charge?.billing_details.address?.city ||
                            ""
                          }, ${charge?.billing_details.address?.country ?? ""}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />
              <div className="w-full flex flex-col gap-2">
                <p className="font-bold">{t("price_breakdown")}</p>
                <p className="font-semibold text-sm">
                  {order.items.length > 1
                    ? t("items-count", { count: order.items.length })
                    : t("item-count", { count: order.items.length })}
                  :
                </p>
                <div className="flex flex-col gap-1 grow pl-2 -mt-2">
                  {order.items.map((item, indx) => {
                    if (item.type == "accommodation") {
                      return (
                        <div
                          key={item.property_id}
                          className="w-full flex flex-col gap-0"
                        >
                          <p className="font-medium text-sm">
                            {indx + 1}. {item.name} - {t("confirmation-code")}
                            {": "}
                            {order.reservationReferences[indx]}
                          </p>
                          <div className="w-full flex flex-col gap-0 pl-3">
                            {item.fees.map((fee) => {
                              return (
                                <div
                                  key={fee.fee_id}
                                  className="w-full flex flex-row items-center justify-between text-sm"
                                >
                                  <p className="">
                                    -{" "}
                                    {fee.fee_name
                                      ?.toLowerCase()
                                      .startsWith("city tax")
                                      ? `${feeT(
                                          "city tax"
                                        )}${fee.fee_name.slice(
                                          "City Tax".length
                                        )}`
                                      : feeT(
                                          fee.fee_name?.toLowerCase() ||
                                            "not-found"
                                        )}
                                  </p>
                                  <p className="">
                                    {fee.total_net}€{" "}
                                    {fee.inclusive_percent &&
                                    fee.inclusive_percent > 0
                                      ? "+ " +
                                        (fee.inclusive_percent * 100).toFixed(
                                          0
                                        ) +
                                        "% IVA"
                                      : ""}
                                  </p>
                                </div>
                              );
                            })}
                            <div className="flex flex-row items-center justify-between text-sm">
                              <p className="font-medium">{t("item_total")}:</p>
                              <p className="">{item.front_end_price}€</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    if (item.type == "activity") {
                      return (
                        <div
                          key={item.id}
                          className="w-full flex flex-col gap-0"
                        >
                          <p className="font-medium text-sm">
                            {indx + 1}. {item.name} - {t("confirmation-code")}
                            {": "}
                            {order.activityBookingIds
                              ? order.activityBookingIds[indx]
                              : ""}
                          </p>
                          <div className="w-full flex flex-col gap-0 pl-3">
                            <div className="flex flex-row items-center justify-between text-sm">
                              <p className="font-medium">{t("item_total")}:</p>
                              <p className="">{item.price}€</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
                <div className="flex flex-row items-center justify-between text-sm">
                  <p className="font-bold">
                    {t("order_total")}{" "}
                    <span className="font-normal">({order.items.length})</span>
                  </p>
                  <p className="">
                    {order.items.reduce((total, item) => {
                      if (item.type === "accommodation") {
                        return total + item.front_end_price;
                      } else if (item.type == "activity") {
                        return total + item.price;
                      } else {
                        return total + item.quantity * item.price;
                      }
                    }, 0)}
                    €
                  </p>
                </div>
              </div>
              <Separator />
              <div className="w-full flex flex-col gap-2">
                <p className="font-bold">{t("payment_details")}</p>
                <div className="flex min-[420px]:flex-row flex-col min-[420px]:items-center items-start justify-between text-sm">
                  <p className="font-semibold">{t("payment-method")}</p>
                  <div className="min-[420px]:max-w-[60%] max-w-full truncate flex flex-row items-center gap-2">
                    <p className="grow truncate">
                      {charge?.payment_method_details?.type === "card" &&
                      charge?.payment_method_details?.card?.last4
                        ? t("card_ending", {
                            last4: charge?.payment_method_details?.card.last4,
                          })
                        : PAYMENT_METHOD_LABELS[
                            charge?.payment_method_details?.type ?? ""
                          ] ??
                          charge?.payment_method_details?.type ??
                          "-"}
                    </p>
                    {renderIcon({
                      paymentMethod:
                        charge?.payment_method_details ?? undefined,
                    })}
                  </div>
                </div>
                <div className="flex min-[420px]:flex-row flex-col min-[420px]:items-center items-start justify-between text-sm">
                  <p className="font-semibold">{t("amount")}</p>
                  <p className="truncate">
                    {((charge?.amount ?? 0) / 100).toFixed(2)}{" "}
                    {charge?.currency.toUpperCase()}
                  </p>
                </div>
                <div className="flex min-[420px]:flex-row flex-col min-[420px]:items-center items-start justify-between text-sm">
                  <p className="font-semibold">{t("status")}</p>
                  <div className="flex flex-row items-center gap-2">
                    <p className="truncate">
                      {t(
                        (charge?.amount_refunded ?? 0) > 0
                          ? "refunded"
                          : charge?.status ?? "unknown-status"
                      )}
                      {charge?.status === "failed" &&
                        " " + charge?.failure_message}
                    </p>
                    {renderStatusIcon({
                      status:
                        (charge?.amount_refunded ?? 0) > 0
                          ? "refunded"
                          : charge?.status || "",
                    })}
                  </div>
                </div>
                <div className="flex min-[420px]:flex-row flex-col min-[420px]:items-center items-start justify-between text-sm">
                  <p className="font-semibold">{t("date")}</p>
                  <p className="truncate">
                    {order.payment_method_id.charge?.created &&
                      format(
                        fromUnixTime(charge?.created || 0),
                        "dd, MMMM yyyy - hh:mm:ss",
                        { locale: localeMap[locale as keyof typeof localeMap] }
                      )}
                  </p>
                </div>
              </div>
              <Separator />
            </div>
          </Card>
        </div>
        <div className="col-span-3 flex flex-col gap-4 order-1 w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Associated Reservations</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              {reservations.map(async (reservation) => {
                const arrayIndx = order.reservationIds.findIndex(
                  (indx) => indx == reservation.reservation.id.toString()
                );
                const data = await callHostkitAPI<{
                  short_link: string;
                  status?: "done";
                }>({
                  listingId: reservation.reservation.listing_id.toString(),
                  endpoint: "getOnlineCheckin",
                  query: { rcode: reservation.reservation.confirmation_code },
                });
                const data2 = await getGuestData(
                  reservation.reservation.confirmation_code,
                  reservation.reservation.listing_id.toString()
                );
                if (!data || !data2) {
                  return;
                }
                let guestInfoDone: "done" | "pending" | "failed" | false =
                  false;
                if (data2.synced) {
                  if (data2.succeeded) {
                    if (data && data.status) {
                      guestInfoDone = "done";
                    }
                  } else {
                    guestInfoDone = "failed";
                  }
                } else {
                  if (
                    data2.guest_data.length === reservation.reservation.guests
                  ) {
                    guestInfoDone = "pending";
                  } else {
                    guestInfoDone = false;
                  }
                }
                return (
                  <div
                    key={reservation.reservation.id}
                    className="flex flex-col gap-0 w-full items-start"
                  >
                    <GetReservationStatus
                      guestInfoCustomDoneField={guestInfoDone}
                      reservation={reservation.reservation}
                      transaction_id={order.transaction_id[arrayIndx]}
                    />
                    <div className="text-left text-sm font-bold">
                      <Button className="p-0! h-fit!" variant={"link"} asChild>
                        <Link
                          href={`https://go.hostify.com/reservations/view/${reservation.reservation.id}`}
                        >
                          <span className="font-semibold">
                            Confirmation Code:{" "}
                            {reservation.reservation.confirmation_code}
                          </span>
                          <LucideSquareArrowOutUpRight />
                        </Link>
                      </Button>
                    </div>
                    <div className="border-muted border-dotted flex flex-row items-start gap-2 w-full mt-0.5">
                      <div className="w-[15%] md:block hidden shrink-0 h-auto aspect-video relative overflow-hidden rounded">
                        <Image
                          unoptimized
                          src={reservation.listing.thumbnail_file}
                          alt="photo"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="grow flex min-[550px]:flex-row flex-col justify-between gap-1 text-sm">
                        <div className="min-[550px]:w-fit min-[550px]:flex-1 flex flex-col gap-1 items-start">
                          <p className="font-bold truncate">
                            {reservation.listing.name}
                          </p>
                          <div className="gap-8 grid grid-cols-2 relative h-fit! w-fit">
                            <div className="col-span-1 flex flex-col">
                              <p className="text-sm font-medium">Arriving</p>
                              <p className="text-xs font-normal">
                                {format(
                                  new Date(reservation.reservation.checkIn),
                                  "EEE, MMM dd",
                                  {
                                    locale:
                                      localeMap[
                                        locale as keyof typeof localeMap
                                      ],
                                  }
                                )}
                              </p>
                            </div>
                            <div className="absolute left-1/2 -translate-x-1/2 h-[60%] w-[0.5px] bg-muted-foreground/50 top-1/2 -translate-y-1/2"></div>
                            <div className="col-span-1 flex flex-col text-right">
                              <p className="text-sm font-medium">Leaving</p>
                              <p className="text-xs font-normal">
                                {format(
                                  new Date(reservation.reservation.checkOut),
                                  "EEE, MMM dd",
                                  {
                                    locale:
                                      localeMap[
                                        locale as keyof typeof localeMap
                                      ],
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs">
                            {propertyCardT("guests", {
                              adults: reservation.orderItem?.adults ?? 0,
                              children:
                                (reservation.orderItem?.children ?? 0) > 0
                                  ? propertyCardT("children_text", {
                                      count:
                                        reservation.orderItem?.children ?? 0,
                                    })
                                  : "",
                              infants:
                                (reservation.orderItem?.infants ?? 0) > 0
                                  ? propertyCardT("infants_text", {
                                      count:
                                        reservation.orderItem?.infants ?? 0,
                                    })
                                  : "",
                            })}
                          </p>
                        </div>
                        <div className="min-[550px]:w-fit shrink-0 flex flex-col gap-0 ml-1">
                          {reservation.orderItem?.fees.map((fee) => {
                            return (
                              <div
                                key={fee.fee_id}
                                className="w-full flex flex-row items-center justify-between text-sm gap-2"
                              >
                                <p className="font-medium">
                                  -{" "}
                                  {fee.fee_name
                                    ?.toLowerCase()
                                    .startsWith("City Tax")
                                    ? `${feeT("city tax")}${fee.fee_name.slice(
                                        "City Tax".length
                                      )}`
                                    : feeT(
                                        fee.fee_name?.toLowerCase() ||
                                          "not-found"
                                      )}
                                </p>
                                <p className="">
                                {fee.total_net}€{" "}
                                    {fee.inclusive_percent &&
                                    fee.inclusive_percent > 0
                                      ? "+ " +
                                        (fee.inclusive_percent * 100).toFixed(
                                          0
                                        ) +
                                        "% IVA"
                                      : ""}
                                </p>
                              </div>
                            );
                          })}
                          <div className="flex flex-row items-center justify-between text-sm">
                            <p className="font-normal">Total:</p>
                            <p className="">
                              {reservation.orderItem?.front_end_price}€
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {reservation.orderItem &&
                      charge?.billing_details.address &&
                      !reservation.orderItem.invoice && (
                        <AttachInvoiceButton
                          orderId={order.orderId}
                          clientName={order.name}
                          clientAddress={
                            charge?.billing_details.address ?? undefined
                          }
                          booking_code={
                            reservation.reservation.confirmation_code
                          }
                          booking_id={reservation.reservation.id}
                          orderIndx={order.items.findIndex(
                            (item) => item == reservation.orderItem
                          )}
                        />
                      )}
                    {reservation.orderItem &&
                      charge?.billing_details.address &&
                      reservation.orderItem.invoice_id && (
                        <IssueNoteButton
                          item={reservation.orderItem!}
                          clientEmail={order.email}
                          invoice_id={reservation.orderItem.invoice_id}
                          booking_code={
                            reservation.reservation.confirmation_code
                          }
                        />
                      )}

                    <div className="pb-2 border-b-2 w-full">
                      <GetGuestSection
                        guest_data={data2 as IGuestDataDocument}
                        guestInfoCustomDoneField={guestInfoDone}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
