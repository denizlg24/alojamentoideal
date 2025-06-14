import { FloatingFilter } from "@/components/home/floating-filter";
import { ListingsHolder } from "@/components/rooms/listings-holder";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
export default function Home({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const { locale } = use<{ locale: string }>(params);

  setRequestLocale(locale);

  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16 px-4">
      <div className="w-full fixed z-90 bg-background h-fit p-4 shadow">
        <FloatingFilter className="max-w-7xl" locale={locale} />
      </div>
      <div className="w-full max-w-7xl md:mt-30 sm:mt-40 mt-62">
        <ListingsHolder locale={locale} />
      </div>
    </main>
  );
}
