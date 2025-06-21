"use client";

import { calculateAmount } from "@/app/actions/calculateAmmount";
import { fetchClientSecret } from "@/app/actions/stripe";
import { useCart } from "@/hooks/cart-context";
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";

const elementStyle = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1f2937", // gray-800
      "::placeholder": {
        color: "#9ca3af", // gray-400
      },
    },
    invalid: {
      color: "#ef4444", // red-500
    },
  },
};
export const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { cart, clearCart } = useCart();
  const [_amount, setAmount] = useState(0);
  const [priceLoading, setPriceLoading] = useState(true);
  useEffect(() => {
    const getAmount = async () => {
      setPriceLoading(true);
      const amount = await calculateAmount(cart);
      setAmount(amount);
      setPriceLoading(false);
    };
    getAmount();
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

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md w-full mx-auto p-6 bg-white shadow-md rounded-xl space-y-6"
    >
      <h2 className="text-xl font-bold text-gray-800">Payment Info</h2>

      <div>
        <label className="block mb-1 text-sm text-gray-700">Card Number</label>
        <div className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
          <CardNumberElement options={elementStyle} />
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block mb-1 text-sm text-gray-700">Expiry</label>
          <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500">
            <CardExpiryElement options={elementStyle} />
          </div>
        </div>
        <div className="flex-1">
          <label className="block mb-1 text-sm text-gray-700">CVC</label>
          <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500">
            <CardCvcElement options={elementStyle} />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading || priceLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
      >
        {priceLoading
          ? "Loading..."
          : loading
          ? "Processing..."
          : `Pay ${_amount}€`}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
};
