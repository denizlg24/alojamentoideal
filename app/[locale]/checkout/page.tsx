import { use } from "react";
import { setRequestLocale } from "next-intl/server";
import { CheckoutHolder } from "@/components/payment-form/checkout-holder";

export default function Page({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const { locale } = use<{ locale: string }>(params);

  setRequestLocale(locale);

  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <CheckoutHolder />
    </main>
  );
}
