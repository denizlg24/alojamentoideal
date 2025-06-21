"use client";

import { calculateAmount } from "@/app/actions/calculateAmmount";
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
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { cart, clearCart, cartLoading } = useCart();
  const [_amount, setAmount] = useState(0);
  const [priceLoading, setPriceLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const getAmount = async () => {
      setPriceLoading(true);
      const amount = await calculateAmount(cart);
      setAmount(amount);
      setPriceLoading(false);
    };
    if (cart.length == 0 && !cartLoading) {
      router.back();
    } else if (!cartLoading) {
      setChecking(false);
      getAmount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const cardNumberElement = elements?.getElement(CardNumberElement);
    const amount = await calculateAmount(cart);
    const { success, client_secret } = await fetchClientSecret(amount);

    if (!success || !stripe || !cardNumberElement || !client_secret) {
      setLoading(false);
      return;
    }

    const result = await stripe.confirmCardPayment(client_secret, {
      payment_method: {
        card: cardNumberElement,
      },
    });

    if (result?.error) {
      setError(result.error.message || "Payment failed");
    } else if (result?.paymentIntent?.status === "succeeded") {
      alert("✅ Payment successful!");
      clearCart();
    }

    setLoading(false);
  };

  if (checking) return null;

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
        <div>
          <label className="block mb-1 text-sm">Card Number</label>
          <div className="p-3 border-b">
            <CardNumberElement options={elementStyle} />
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block mb-1 text-sm">Expiry</label>
            <div className="p-2 border-b">
              <CardExpiryElement options={elementStyle} />
            </div>
          </div>
          <div className="flex-1">
            <label className="block mb-1 text-sm">CVC</label>
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
            ? "Loading..."
            : loading
            ? "Processing..."
            : `Pay ${_amount / 10}€`}
        </Button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </Card>
  );
};
