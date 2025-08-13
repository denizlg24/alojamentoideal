"use client";

import { useState } from "react";
import { Card } from "../ui/card";
import { getOrderByReference } from "@/app/actions/getOrderByReference";
import { useRouter } from "@/i18n/navigation";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";

export const OrderSearch = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingCode, updateBookingCode] = useState("");
  const router = useRouter();
  const t = useTranslations("orderSearch");
  const searchBooking = async () => {
    setLoading(true);
    const orderId = await getOrderByReference(bookingCode);
    if (orderId) {
      router.push(`/orders/${orderId}`);
    } else {
      setError("not_found");
    }
    setLoading(false);
  };

  return (
    <Card className="p-2 flex flex-col gap-1 w-full">
      <div className="w-full flex sm:flex-row flex-col gap-2">
        <Input
          value={bookingCode}
          onChange={(e) => {
            setError("");
            updateBookingCode(e.target.value);
          }}
          placeholder={t("placeholder")}
          type="text"
          className="grow w-full p-3"
        />
        <Button
          disabled={loading}
          variant="outline"
          onClick={() => {
            searchBooking();
          }}
        >
          {loading ? (
            <>
              <Loader2Icon className="animate-spin" />
              {t("searching")}
            </>
          ) : (
            t("find")
          )}
        </Button>
      </div>
      {error && (
        <p className="text-destructive font-semibold text-sm">{t(error)}</p>
      )}
    </Card>
  );
};
