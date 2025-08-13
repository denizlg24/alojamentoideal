"use client";

import { getOrderById } from "@/app/actions/getOrder";
import { CustomFieldType } from "@/schemas/custom-field.schema";
import { OrderType } from "@/schemas/order.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { useEffect, useState } from "react";
import { OrderInfo } from "./order-info";
import { useCart } from "@/hooks/cart-context";

export const OrderInfoProvider = ({ id }: { id: string }) => {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderType | undefined>(undefined);
  const [customFields, setCustomFields] = useState<
    { reservation_id: string; custom_fields: CustomFieldType[] }[]
  >([]);
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
    localStorage.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
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

    const getOrder = async (id: string) => {
      setLoading(true);
      const { success, order } = await getOrderById(id);
      if (success && order) {
        setOrder(order);
        for (const rId of order.reservationIds) {
          console.log(rId);
          const custom_fields = (await getReservationCustomFields(rId)) || [];
          setCustomFields((prev) => {
            const newArr = [...prev];
            const index = newArr.findIndex(
              (item) => item.reservation_id === rId
            );
            if (index !== -1) {
              newArr[index] = { reservation_id: rId, custom_fields };
            } else {
              newArr.push({ reservation_id: rId, custom_fields });
            }
            return newArr;
          });
        }
      }
      setLoading(false);
    };

    if (id) {
      getOrder(id);
    }
  }, [id]);

  return (
    <OrderInfo order={order} custom_fields={customFields} loading={loading} />
  );
};
