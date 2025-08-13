import { use } from "react";
import { setRequestLocale } from "next-intl/server";
import { RoomCheckoutProvider } from "@/components/room/checkout/room-checkout-provider";

export default function Page({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const { locale, id } = use<{ locale: string; id: string }>(params);
  setRequestLocale(locale);

  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <RoomCheckoutProvider id={id} />
    </main>
  );
}
