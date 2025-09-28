"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
//import { usePathname } from "@/i18n/navigation";
import { DialogClose } from "@radix-ui/react-dialog";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useRef } from "react";

export const CancelBookingButton = ({
  refundPercentage,
  //productConfirmationCode,
}: {
  refundPercentage: number;
 // productConfirmationCode: string;
}) => {
  const t = useTranslations("propertyCard");
  const [loading, setLoading] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  //const pathname = usePathname();
  const [error, setError] = useState("");
  const cancel = async () => {
    setError("");
    setLoading(true);
   
    //if (response) {
    //  closeBtnRef.current?.click();
    //  window.location.href = pathname;
    //} else {
    //  setError(t("error-canceling"));
    //}
    setLoading(false);
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"default"}>
          {t("cancel-reservation-variable", {
            variable:
              refundPercentage == 0
                ? t("no-refund")
                : refundPercentage == 50
                ? t("partial-refund")
                : t("full-refund"),
          })}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("are-you-sure")}</DialogTitle>
          <DialogDescription>
            {t("cancelling-is-irreversible-house")}
          </DialogDescription>
          <div className="grid min-[420px]:grid-cols-2 grid-cols-1 w-full gap-x-4 gap-y-2">
            <Button
            disabled={loading}
              onClick={() => {
                cancel();
              }}
              variant={"default"}
            >
                {loading ? <><Loader2 className="animate-spin"/> {t("cancelling")}</> :t("cancel-reservation-house") }
            </Button>
            <DialogClose asChild>
              <Button disabled={loading} ref={closeBtnRef} variant={"secondary"}>
                {t("close")}
              </Button>
            </DialogClose>
          </div>
          {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
