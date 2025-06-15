import { FloatingFilter } from "@/components/home/floating-filter";
import { ListingsHolder } from "@/components/rooms/listings-holder";
import { Skeleton } from "@/components/ui/skeleton";
import { setRequestLocale } from "next-intl/server";
import { Suspense, use } from "react";
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
        <Suspense
          fallback={<Skeleton className="w-full max-w-7xl mx-auto h-[200px]" />}
        >
          <FloatingFilter className="max-w-7xl" />
        </Suspense>
      </div>
      <div className="w-full max-w-7xl md:mt-30 sm:mt-40 mt-62">
        <Suspense fallback={<Skeleton className="w-full mx-auto h-[500px]" />}>
          <ListingsHolder />
        </Suspense>
      </div>
    </main>
  );
}
