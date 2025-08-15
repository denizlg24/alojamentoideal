"use client";

import { calculateAmount } from "@/app/actions/calculateAmount";
import { fetchClientSecret } from "@/app/actions/stripe";
import { useCart } from "@/hooks/cart-context";
import { useRouter } from "@/i18n/navigation";
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { hostifyRequest } from "@/utils/hostify-request";
import { ReservationType } from "@/schemas/reservation.schema";
import { addDays, format } from "date-fns";
import { registerOrder } from "@/app/actions/createOrder";
import { useTranslations } from "next-intl";

const elementStyle = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1f2937",
      "::placeholder": {
        color: "#9ca3af",
      },
    },
    invalid: {
      color: "#ef4444",
    },
  },
};
export const CheckoutForm = () => {
  const t = useTranslations("checkout_form");
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { cart, cartLoading } = useCart();
  const [_amount, setAmount] = useState(0);
  const [priceLoading, setPriceLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const router = useRouter();
  useEffect(() => {
    const getAmount = async () => {
      setPriceLoading(true);
      const amount = await calculateAmount(cart);
      setAmount(amount);
      setPriceLoading(false);
    };
    if (cart.length == 0 && !cartLoading) {
      if (document.referrer && document.referrer !== window.location.href) {
        router.back();
      } else {
        router.push("/");
      }
    } else if (!cartLoading) {
      setChecking(false);
      getAmount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);
  const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
    setLoading(true);
    setLoadingMessage("loading_verify_price");
    setError("");

    const clientName = data.name;
    const clientEmail = data.email;
    const clientPhone = data.phone;
    const clientNotes = data.note;

    const cardNumberElement = elements?.getElement(CardNumberElement);
    const amount = await calculateAmount(cart);
    const amounts = [];
    const reservationIds = [];
    const reservationReferences = [];

    for (const property of cart.filter((i) => i.type == "accommodation")) {
      const property_amount = await calculateAmount([property]);
      amounts.push(property_amount);
    }
    let i = 0;
    for (const property of cart.filter((i) => i.type == "accommodation")) {
      setLoadingMessage("loading_create_res");
      const reservation = await hostifyRequest<{
        reservation: ReservationType;
      }>(
        `reservations`,
        "POST",
        undefined,
        {
          listing_id: property.property_id,
          start_date: property.start_date,
          end_date: property.end_date,
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          total_price: amounts[i] / 100,
          source: "alojamentoideal.pt",
          status: "pending",
          note: clientNotes,
          guests: property.adults + property.children,
          pets: property.pets,
          fees: property.fees,
        },
        undefined,
        undefined
      );
      i++;
      if (!reservation.reservation.id) {
        setError("error_reservation");
        continue;
      }
      reservationIds.push(reservation.reservation.id);
      reservationReferences.push(reservation.reservation.confirmation_code);
    }
    setLoadingMessage("loading_process_pay");
    const { success, client_secret } = await fetchClientSecret(
      amount,
      clientName,
      clientEmail,
      clientPhone,
      clientNotes,
      reservationIds
    );

    if (!success || !stripe || !cardNumberElement || !client_secret) {
      setLoadingMessage("loading_cancel_res");
      for (const rId of reservationIds) {
        await hostifyRequest<{ success: boolean }>(
          `reservations/${rId}`,
          "PUT",
          undefined,
          {
            status: "denied",
          },
          undefined,
          undefined
        );
      }
      setLoading(false);
      return;
    }

    setLoadingMessage("loading_verify_pay");

    const result = await stripe.confirmCardPayment(client_secret, {
      payment_method: {
        card: cardNumberElement,
      },
    });

    if (result?.error) {
      setLoadingMessage("loading_cancel_res");
      for (const rId of reservationIds) {
        await hostifyRequest<{ success: boolean }>(
          `reservations/${rId}`,
          "PUT",
          undefined,
          {
            status: "denied",
          },
          undefined,
          undefined
        );
      }
      setLoading(false);
      setError(result.error.message || "Payment failed");
    } else if (result?.paymentIntent?.status === "succeeded") {
      setLoadingMessage("loading_confirm_tx");
      let b = 0;
      for (const rId of reservationIds) {
        const transaction = await hostifyRequest<{ success: boolean }>(
          "transactions",
          "POST",
          undefined,
          {
            reservation_id: rId,
            amount: amounts[b] / 100,
            currency: "EUR",
            charge_date: format(new Date(), "yyyy-MM-dd"),
            arrival_date: format(addDays(new Date(), 2), "yyyy-MM-dd"),
            is_completed: 1,
            type: "accommodation",
          }
        );
        b++;
        if (!transaction.success) {
          setLoadingMessage("loading_cancel_res");

          await hostifyRequest<{ success: boolean }>(
            `reservations/${rId}`,
            "PUT",
            undefined,
            {
              status: "denied",
            },
            undefined,
            undefined
          );

          setError("error_transaction");

          continue;
        }
        setLoadingMessage("loading_confirm_res");

        await hostifyRequest<{ success: boolean }>(
          `reservations/${rId}`,
          "PUT",
          undefined,
          {
            status: "accepted",
          },
          undefined,
          undefined
        );
      }
      setLoadingMessage("loading_save_order");
      const { success, orderId } = await registerOrder({
        name: clientName,
        email: clientEmail,
        phoneNumber: clientPhone,
        notes: clientNotes,
        reservationIds: reservationIds.map((id) => id.toString()),
        reservationReferences: reservationReferences,
        items: cart,
      });

      if (success && orderId) {
        await router.push(`/orders/${orderId}`);
      }
    }

    setLoading(false);
  };

  const FormSchema = z.object({
    name: z.string().min(2, {
      message: t("error_username"),
    }),
    email: z.string().email({
      message: t("error_email"),
    }),
    phone: z.string().regex(/^\+[1-9]\d{1,3}\d{6,14}$/, t("error_phone")),
    note: z.string().min(0),
  });

  const clientInfo = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      note: "",
    },
  });

  if (checking) return null;

  return (
    <Card className="p-4">
      <Form {...clientInfo}>
        <form
          onSubmit={clientInfo.handleSubmit(handleSubmit)}
          className="w-full flex flex-col gap-4"
        >
          <FormField
            control={clientInfo.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full flex flex-col gap-0">
                <FormLabel className="text-sm font-normal">
                  {t("name")}
                </FormLabel>
                <FormControl>
                  <Input
                    className="border-t-0 text-base! border-x-0 rounded-none p-3! border-b! shadow-none focus:outline-0! focus:ring-0!"
                    placeholder={t("name_placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={clientInfo.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full flex flex-col gap-0">
                <FormLabel className="text-sm font-normal">
                  {t("email")}
                </FormLabel>
                <FormControl>
                  <Input
                    className="border-t-0 text-base! border-x-0 rounded-none p-3! border-b! shadow-none focus:outline-0! focus:ring-0!"
                    placeholder={t("email_placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={clientInfo.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="w-full flex flex-col gap-0">
                <FormLabel className="text-sm font-normal">
                  {t("phone")}
                </FormLabel>
                <FormControl>
                  <Input
                    className="border-t-0 text-base! border-x-0 rounded-none p-3! border-b! shadow-none focus:outline-0! focus:ring-0!"
                    placeholder={t("phone_placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={clientInfo.control}
            name="note"
            render={({ field }) => (
              <FormItem className="w-full flex flex-col gap-0">
                <FormLabel className="text-sm font-normal">
                  {t("notes")}
                </FormLabel>
                <FormControl>
                  <Input
                    className="border-t-0 text-base! border-x-0 rounded-none p-3! border-b! shadow-none focus:outline-0! focus:ring-0!"
                    placeholder={t("notes_placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col w-full gap-0">
            <label className="block text-sm">{t("card_number")}</label>
            <div className="p-3 border-b">
              <CardNumberElement options={elementStyle} />
            </div>
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm">{t("expiry")}</label>
              <div className="p-2 border-b">
                <CardExpiryElement options={elementStyle} />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm">{t("cvc")}</label>
              <div className="p-2 border-b">
                <CardCvcElement options={elementStyle} />
              </div>
            </div>
          </div>
          <Button
            className="w-full text"
            type="submit"
            disabled={!stripe || loading || priceLoading}
          >
            {priceLoading
              ? t("loading")
              : loading
              ? t(loadingMessage)
              : `Pay ${_amount / 100}€`}
          </Button>
          {error.includes("_")
            ? error && (
                <p className="text-red-600 text-sm mx-auto">{t(error)}</p>
              )
            : error && <p className="text-red-600 text-sm mx-auto">{error}</p>}
        </form>
      </Form>
    </Card>
  );
};
