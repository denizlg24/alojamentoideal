"use client";
import { CustomFieldType } from "@/schemas/custom-field.schema";
import { OrderType } from "@/schemas/order.schema";
import { Skeleton } from "../ui/skeleton";
import { Card } from "../ui/card";
import { Separator } from "../ui/separator";
import { format } from "date-fns";
import { PropertyInfoCard } from "./property-info-card";
import { useTranslations } from "next-intl";

export const OrderInfo = ({
  order,
  custom_fields,
  loading,
}: {
  order: OrderType | undefined;
  custom_fields: {
    reservation_id: string;
    custom_fields: CustomFieldType[];
  }[];
  loading: boolean;
}) => {
  const t = useTranslations("order");
  if (loading || !order || !custom_fields) {
    return (
      <div className="w-full max-w-7xl mx-auto md:grid flex flex-col-reverse grid-cols-5 gap-8 px-4 pt-12">
        <Skeleton className="col-span-3 w-full h-[300px]" />
        <Skeleton className="col-span-2 w-full h-[300px]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto md:grid flex flex-col-reverse grid-cols-5 gap-8 px-4 pt-12">
      <div className="col-span-3 w-full flex flex-col gap-6">
        <h1 className="md:text-xl sm:text-lg text-base font-semibold">
          {t("order_info")}
        </h1>
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
              <PropertyInfoCard
                key={item.property_id}
                start_date={item.start_date}
                end_date={item.end_date}
                adults={item.adults}
                children_={item.children}
                infants={item.infants}
                listingId={item.property_id}
                reservationId={order.reservationIds[indx]}
                custom_fields={
                  custom_fields.find(
                    (a) => a.reservation_id === order.reservationIds[indx]
                  )?.custom_fields
                }
              />
            );
          })}
      </div>
      <div className="col-span-2 w-full">
        <Card className="p-6 w-full flex flex-col gap-2">
          <h1 className="sm:text-lg text-sm font-semibold">{t("invoice")}</h1>
          <Separator />
          <div className="flex flex-row items-center justify-between text-sm">
            <p className="font-semibold">{t("order_id")}</p>
            <p className="font-semibold max-w-[60%] truncate">#{order?._id}</p>
          </div>
          <div className="flex flex-row items-center justify-between text-sm">
            <p className="font-semibold">{t("created_at")}</p>
            <p className="">
              {format(new Date(order.createdAt), "yyyy-MM-dd hh:mm")}
            </p>
          </div>
          <Separator />
          <div className="flex flex-row items-center justify-between text-sm">
            <p className="font-semibold">{t("name_on_order")}</p>
            <p className="max-w-[60%] truncate">{order.name}</p>
          </div>
          <div className="flex flex-row items-center justify-between text-sm">
            <p className="font-semibold">
              {t("order_total")} ({order.items.length})
            </p>
            <p className="">
              {order.items.reduce((total, item) => {
                if (item.type === "accommodation") {
                  return total + item.front_end_price;
                } else {
                  return total + item.quantity * item.price;
                }
              }, 0)}
              €
            </p>
          </div>
          <Separator />
          <p className="font-semibold text-sm">{t("price_breakdown")}</p>
          <div className="flex flex-col gap-1 w-full">
            {order.items.map((item) => {
              if (item.type == "accommodation") {
                return (
                  <div
                    key={item.property_id}
                    className="w-full flex flex-col gap-0"
                  >
                    <p className="font-semibold text-sm">{item.name}</p>
                    <div className="w-full flex flex-col gap-0 ml-1">
                      {item.fees.map((fee) => {
                        return (
                          <div
                            key={fee.fee_id}
                            className="w-full flex flex-row items-center justify-between text-sm"
                          >
                            <p className="font-semibold">- {fee.fee_name}</p>
                            <p className="">{fee.total}€</p>
                          </div>
                        );
                      })}
                      <div className="flex flex-row items-center justify-between text-sm">
                        <p className="font-semibold">{t("item_total")}:</p>
                        <p className="">{item.front_end_price}€</p>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
