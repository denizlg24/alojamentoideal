"use client";

import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { FaFilePdf } from "react-icons/fa6";

export const TicketButton = ({
  base64,
  title,
}: {
  base64: string;
  title: string;
}) => {
  const url = useMemo(() => {
    const blob = new Blob(
      [Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))],
      { type: "application/pdf" }
    );
    return URL.createObjectURL(blob);
  },[base64]);
  return (
    <Button
      onClick={() => {
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }}
      className="w-fit p-0! h-fit!"
      variant={"link"}
    >
      <FaFilePdf /> {title}
    </Button>
  );
};
