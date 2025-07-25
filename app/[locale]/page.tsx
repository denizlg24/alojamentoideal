import { setRequestLocale } from "next-intl/server";
import { Suspense, use } from "react";
import { FloatingFilter } from "@/components/home/floating-filter";
import { AccommodationMapHolder } from "@/components/home/accommodation-map-holder";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoHolder } from "@/components/home/video-holder";

export default function Home({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const { locale } = use<{ locale: string }>(params);
  setRequestLocale(locale);

  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <div className="w-full relative flex flex-col items-center">
        <VideoHolder />
        <div className="absolute sm:flex hidden bottom-0 translate-y-1/2 w-full flex-col items-center z-90 px-2">
          <Suspense
            fallback={<Skeleton className="w-full mx-auto h-[120px]" />}
          >
            <FloatingFilter />
          </Suspense>
        </div>
      </div>
      <div className="sm:hidden w-full flex flex-col items-center z-90 px-2">
        <Suspense fallback={<Skeleton className="w-full mx-auto h-[200px]" />}>
          <FloatingFilter />
        </Suspense>
      </div>
      <div className="w-full max-w-7xl mt-4 mx-auto h-[450px] sm:mt-16 flex flex-col gap-2 px-2">
        <AccommodationMapHolder />
      </div>
      {/*<RecommendedListings />*/}
    </main>
  );
}
