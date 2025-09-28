"use client";
import { attachInvoice } from "@/app/actions/attachInvoice";
import { createHouseInvoice } from "@/app/actions/createHouseInvoice";
import { Button } from "@/components/ui/button";
import { Address } from "@stripe/stripe-js";
import { Loader2, NotepadText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const AttachInvoiceButton = ({
  clientName,
  clientAddress,
  clientTax,
  booking_code,
  orderId,
  booking_id,
  orderIndx,
}: {
  clientName: string;
  clientAddress?: Address;
  clientTax?: string;
  orderId: string;
  booking_code: string;
  booking_id:number;
  orderIndx: number;
}) => {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const invoice_url = await createHouseInvoice({
          clientName,
          clientAddress,
          clientTax: clientTax ?? "",
          booking_code,
          reservationId:booking_id
        });
        if (orderIndx >= 0 && invoice_url) {
          const success = await attachInvoice({
            orderId: orderId,
            index: orderIndx,
            invoice_url,
          });
          setLoading(false);
          if (success) {
            toast.success("Attached invoice to product.");
            return;
          }
          if (!success) {
            toast.error("Failed to attach to item.");
            return;
          }
        }
        setLoading(false);
        if (!invoice_url) {
          toast.error("Failed to create invoice");
          return;
        }
        if (!orderIndx) {
          toast.error("Failed to find order item.");
          return;
        }
      }}
      className="h-fit! p-1! rounded! mt-1 w-[15%]"
    >
      {loading ? (
        <>
          Issuing... <Loader2 className="animate-spin" />
        </>
      ) : (
        <>
          Issue invoice <NotepadText />
        </>
      )}
    </Button>
  );
};
