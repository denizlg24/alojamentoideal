"use client";
import { CustomFieldType } from "@/schemas/custom-field.schema";
import { OrderType } from "@/schemas/order.schema";
import { Skeleton } from "../ui/skeleton";
import { Separator } from "../ui/separator";
import { format } from "date-fns";
import { PropertyInfoCard } from "./property-info-card";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

export const OrderInfo = ({
  order,
  custom_fields,
  loading,
  refreshCustomFields,
}: {
  order: OrderType | undefined;
  refreshCustomFields: () => void;
  custom_fields: {
    reservation_id: string;
    custom_fields: CustomFieldType[];
  }[];
  loading: boolean;
}) => {
  const t = useTranslations("order");
  if (loading || !order) {
    return (
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 px-4 pt-12">
        <Skeleton className="w-full h-[70px]" />
        <Skeleton className="w-full h-[300px]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 px-4 pt-12">
      <div className="col-span-3 w-full flex flex-col gap-6">
        <h1 className="md:text-xl sm:text-lg text-base font-semibold">
          {t("order_info")}
        </h1>
        <Accordion
          type="single"
          collapsible
          className="border px-4 rounded-lg shadow"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className="flex flex-row items-center justify-between text-sm">
                <p className="font-bold">{t("order_id")}</p>
                <p className="font-normal max-w-[60%] truncate">
                  #{order?._id}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent asChild>
              <div className="col-span-3 w-full flex flex-col gap-4">
                <Separator />
                <div className="flex flex-row items-center justify-between text-sm">
                  <p className="font-bold">{t("created_at")}</p>
                  <p className="">
                    {format(new Date(order.createdAt), "yyyy-MM-dd hh:mm")}
                  </p>
                </div>
                <Separator />
                <div className="w-full flex flex-col gap-2">
                  <div className="flex flex-row items-center justify-between text-sm">
                    <p className="font-bold">{t("name_on_order")}</p>
                    <p className="max-w-[60%] truncate">{order.name}</p>
                  </div>
                  <div className="flex flex-row items-center justify-between text-sm">
                    <p className="font-bold">
                      {t("order_total")}{" "}
                      <span className="font-normal">
                        ({order.items.length})
                      </span>
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
                </div>
                <Separator />
                <div className="w-full flex flex-col gap-2">
                  <p className="font-bold text-sm">{t("price_breakdown")}</p>
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
                                    <p className="font-medium">
                                      - {fee.fee_name}
                                    </p>
                                    <p className="">{fee.total}€</p>
                                  </div>
                                );
                              })}
                              <div className="flex flex-row items-center justify-between text-sm">
                                <p className="font-normal">
                                  {t("item_total")}:
                                </p>
                                <p className="">{item.front_end_price}€</p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
                refreshCustomFields={refreshCustomFields}
                item={item}
                photo={item.photo}
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
    </div>
  );
};
