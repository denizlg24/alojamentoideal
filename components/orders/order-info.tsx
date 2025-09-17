"use client";
import { Separator } from "../ui/separator";
import { format, fromUnixTime } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { IOrder } from "@/models/Order";
import { PropertyItemCard } from "./property-item-card";
import { Card } from "../ui/card";
import { localeMap, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import { PaymentIntent } from "@stripe/stripe-js";
import {
  PaymentIcon,
  PaymentTypeExtended,
} from "react-svg-credit-card-payment-icons";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Landmark,
  Printer,
  RefreshCcw,
  Wallet,
  XCircle,
} from "lucide-react";
import Stripe from "stripe";
import { FaCcApplePay } from "react-icons/fa6";
import { useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "../ui/button";
import { useCart } from "@/hooks/cart-context";

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

export const OrderInfo = ({
  order,
  paymentIntent,
  charge,
}: {
  order: IOrder;
  charge: Stripe.Charge | undefined;
  paymentIntent: PaymentIntent | undefined;
}) => {
  const t = useTranslations("order");
  const feeT = useTranslations("feeTranslations");
  const locale = useLocale();
  const cardRef = useRef<HTMLDivElement>(null);
  const {clearCart} = useCart();
  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: `Alojamento Ideal Order: ${order?.orderId}`,
  });

  useEffect(() => {
    localStorage.clear();
    clearCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 px-4 pt-12">
      <div className="col-span-3 w-full flex flex-col gap-6">
        <h1 className="md:text-xl sm:text-lg text-base font-semibold">
          {t("order_info")}
        </h1>
        <Card ref={cardRef} className="px-4 flex flex-col gap-2">
          <div className="flex flex-row items-center justify-between text-sm w-full relative">
            <p className="font-bold">{t("order_id")}</p>
            <p className="font-normal max-w-[60%] truncate">#{order.orderId}</p>
          </div>
          <div className="col-span-3 w-full flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between text-sm">
              <p className="font-bold">{t("created_at")}</p>
              <p className="">
                {format(new Date(order.createdAt), "dd, MMMM yyyy - h:mm bbb", {
                  locale: localeMap[locale as keyof typeof localeMap],
                })}
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
                    <p className="max-w-[60%] truncate">{order.companyName}</p>
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
                                    .startsWith("City Tax")
                                    ? `${feeT("city tax")}${fee.fee_name.slice(
                                        "City Tax".length
                                      )}`
                                    : feeT(
                                        fee.fee_name?.toLowerCase() ||
                                          "not-found"
                                      )}
                                </p>
                                <p className="">{fee.total}€</p>
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
                    } else if (item.type === "product") {
                      return total + item.quantity * item.price;
                    } else {
                      return total + item.price;
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
                    paymentMethod: charge?.payment_method_details ?? undefined,
                  })}
                </div>
              </div>
              <div className="flex min-[420px]:flex-row flex-col min-[420px]:items-center items-start justify-between text-sm">
                <p className="font-semibold">{t("amount")}</p>
                <p className="truncate">
                  {((paymentIntent?.amount ?? 0) / 100).toFixed(2)}{" "}
                  {paymentIntent?.currency.toUpperCase()}
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
                  {charge?.created &&
                    format(
                      fromUnixTime(charge?.created),
                      "dd, MMMM yyyy - hh:mm:ss",
                      { locale: localeMap[locale as keyof typeof localeMap] }
                    )}
                </p>
              </div>
            </div>
            <Separator />
            <Button onClick={handlePrint} className="w-fit!">
              {t("print")} <Printer />
            </Button>
          </div>
        </Card>
        <div className="w-full flex flex-col gap-4">
          <h2 className="md:text-lg sm:text-base text-sm font-semibold">
            {t("reservations")} (
            {order.items.reduce(
              (total, item) =>
                item.type == "accommodation" ? (total += 1) : total,
              0
            )}
            )
          </h2>
        </div>
        {order.items
          .filter((_) => _.type == "accommodation")
          .map((item, indx) => {
            return (
              <PropertyItemCard
                item={item}
                photo={item.photo}
                key={item.property_id}
                start_date={item.start_date}
                end_date={item.end_date}
                adults={item.adults}
                children_={item.children}
                infants={item.infants}
                reservation_id={order.reservationIds[indx]}
              />
            );
          })}
      </div>
    </div>
  );
};
