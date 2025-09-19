"use client";

import { issueCreditNote } from "@/app/actions/createHouseInvoice";
import { Button } from "@/components/ui/button";
import { AccommodationItem } from "@/hooks/cart-context";
import { Loader2, NotepadText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const IssueNoteButton = ({
  item,
  clientEmail,
  invoice_id,
  booking_code,
}: {
  item: AccommodationItem;
  clientEmail: string;
  invoice_id: string;
  booking_code: string;
}) => {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const success = await issueCreditNote({
          clientEmail,
          invoice_id,
          item,
          reservationCode: booking_code,
        });

        setLoading(false);
        if (!success) {
          toast.error("Failed to issue credit note.");
          return;
        }
        toast.success("Issued Credit Note");
      }}
      className="h-fit! p-1! rounded! mt-1 w-[15%]"
    >
      {loading ? (
        <>
          Issuing... <Loader2 className="animate-spin" />
        </>
      ) : (
        <>
          Issue Credit Note <NotepadText />
        </>
      )}
    </Button>
  );
};
