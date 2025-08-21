import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense, use } from "react";
import { FloatingFilter } from "@/components/home/floating-filter";
import { AccommodationMapHolder } from "@/components/home/accommodation-map-holder";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoHolder } from "@/components/home/video-holder";
import { OrderSearch } from "@/components/home/order-search";
import { useTranslations } from "next-intl";

export async function generateMetadata() {
  const t = await getTranslations("metadata");

  return {
    title: t("home.title"),
    description: t("home.description"),
    keywords: t("home.keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      title: t("home.title"),
      description: t("home.description"),
      url: "https://alojamentoideal.com",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("home.title"),
      description: t("home.description"),
    },
  };
}

export default function Home({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const { locale } = use<{ locale: string }>(params);
  setRequestLocale(locale);
  const t = useTranslations("home");
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <div className="w-full relative flex flex-col items-center">
        <VideoHolder />
        <div className="absolute sm:flex hidden bottom-0 translate-y-1/2 w-full flex-col items-center z-85 px-4">
          <Suspense
            fallback={<Skeleton className="w-full mx-auto h-[120px]" />}
          >
            <FloatingFilter />
          </Suspense>
        </div>
      </div>
      <div className="sm:hidden w-full flex flex-col items-center z-85 px-4">
        <h2 className="sm:hidden block text-base text-left w-full font-semibold mt-6">
          {t("searching")}
        </h2>
        <Suspense fallback={<Skeleton className="w-full mx-auto h-[200px]" />}>
          <FloatingFilter />
        </Suspense>
      </div>
      <div className="w-full px-4 max-w-7xl mx-auto sm:mt-16 flex flex-col gap-1">
        <h2 className="lg:text-xl md:text-lg text-base font-semibold">
          {t("have_res")}
        </h2>
        <OrderSearch />
      </div>
      <div className="w-full max-w-7xl mt-4 mx-auto h-[450px] sm:mt-8 flex flex-col gap-2 px-4">
        <AccommodationMapHolder />
      </div>
      {/*<RecommendedListings />*/}
    </main>
  );
}
