import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense, use } from "react";
import { FloatingFilter } from "@/components/home/floating-filter";
import { AccommodationMapHolder } from "@/components/home/accommodation-map-holder";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderSearch } from "@/components/home/order-search";
import { useTranslations } from "next-intl";
import { HomeVideoHolder } from "@/components/home/home-video-holder";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { KeyRound } from "lucide-react";
//import { AddWebhookButton } from "./add-webhook-button";

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
      url: "https://alojamentoideal.pt",
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
        <HomeVideoHolder />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-50% via-black/30 to-transparent"></div>
        <div className="absolute sm:flex hidden bottom-0 translate-y-1/2 w-full flex-col items-center z-85 px-4">
          <Suspense
            fallback={<Skeleton className="w-full mx-auto h-[120px]" />}
          >
            <FloatingFilter />
          </Suspense>
        </div>
      </div>
      <div className="z-85 sm:pt-22 pt-6 w-full max-w-7xl flex flex-col gap-4 sm:items-start sm:text-left text-center absolute px-4">
        <h1 className="font-black md:text-5xl sm:text-4xl text-3xl text-white text-shadow-lg">
          {t("headline")}
        </h1>
        <h2 className="font-bold md:text-3xl sm:text-2xl text-xl text-white text-shadow-lg">
          Alojamento Ideal &mdash; {t("your-jorney-start-with-us")}
        </h2>
        <Button
          asChild
          variant={"default"}
          size={"lg"}
          className="rounded-full sm:w-auto font-bold w-full hover:text-white border-2 border-transparent hover:border-white hover:bg-transparent transition-colors"
        >
          <Link href={"/owner"}>
            <KeyRound />
            {t("property-owner")}
          </Link>
        </Button>
        <div className="sm:hidden w-full flex flex-col items-center z-85">
          <Suspense
            fallback={<Skeleton className="w-full mx-auto h-[200px]" />}
          >
            <FloatingFilter />
          </Suspense>
        </div>
        <div className="w-full px-4 max-w-7xl mx-auto flex sm:hidden flex-col gap-1 bg-background py-4 rounded-xl">
          <h2 className="lg:text-xl md:text-lg text-base font-semibold">
            {t("have_res")}
          </h2>
          <OrderSearch />
        </div>
      </div>
      <div className="w-full px-4 max-w-7xl mx-auto mt-16 sm:flex hidden flex-col gap-1">
        <h2 className="lg:text-xl md:text-lg text-base font-semibold">
          {t("have_res")}
        </h2>
        <OrderSearch />
      </div>
      <div className="w-full max-w-7xl mt-4 mx-auto h-full sm:mt-8 flex flex-col px-4">
        <Suspense fallback={<Skeleton className="w-full mx-auto h-[350px]" />}>
          <AccommodationMapHolder />
        </Suspense>
      </div>
      {/*<div>
        <AddWebhookButton />
      </div>*/}
      {/*<RecommendedListings />*/}
    </main>
  );
}
