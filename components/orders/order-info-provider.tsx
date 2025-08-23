"use client";

import { getOrderById } from "@/app/actions/getOrder";
import { useEffect, useState } from "react";
import { OrderInfo } from "./order-info";
import { useCart } from "@/hooks/cart-context";
import { OrderDocument } from "@/models/Order";

export const OrderInfoProvider = ({ id }: { id: string }) => {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDocument | undefined>(undefined);
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
    localStorage.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const getOrder = async (id: string) => {
      setLoading(true);
      const { success, order } = await getOrderById(id);
      if (success && order) {
        setOrder(order as OrderDocument);
      }
      setLoading(false);
    };

    if (id) {
      getOrder(id);
    }
  }, [id]);

  return <OrderInfo order={order} loading={loading} />;
};
