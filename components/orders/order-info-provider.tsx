"use client";

import { getOrderById } from "@/app/actions/getOrder";
import { useEffect, useState } from "react";
import { OrderInfo } from "./order-info";
import { useCart } from "@/hooks/cart-context";
import { IOrder } from "@/models/Order";
import { useRouter } from "@/i18n/navigation";
import { PaymentIntent } from "@stripe/stripe-js";
import { getPaymentIntent } from "@/app/actions/getPaymentIntent";
import Stripe from "stripe";

export const OrderInfoProvider = ({ id }: { id: string }) => {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<
    | {
        order: IOrder;
        paymentIntent: PaymentIntent | undefined;
        charge: Stripe.Charge | undefined;
      }
    | undefined
  >(undefined);
  const router = useRouter();
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
        const payment_intent = order.payment_id
          ? await getPaymentIntent(order.payment_id)
          : undefined;
        setOrder({
          order,
          paymentIntent: payment_intent?.intent,
          charge: payment_intent?.charge,
        });
      } else {
        router.push("/order-not-found");
      }
      setLoading(false);
    };

    if (id) {
      getOrder(id);
    }
  }, [id, router]);

  return (
    <OrderInfo
      order={order?.order}
      paymentIntent={order?.paymentIntent}
      charge={order?.charge}
      loading={loading}
    />
  );
};
