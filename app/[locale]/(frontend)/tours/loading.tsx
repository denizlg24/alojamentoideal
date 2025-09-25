import { Skeleton } from "@/components/ui/skeleton";
import toursBanner from "@/public/porto-banner.jpeg";
import { useTranslations } from "next-intl";
import Image from "next/image";
export default function Loading() {
  const t =useTranslations("header");
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16">
      <div className="w-full relative">
        <Image
          unoptimized
          alt="tours-banner"
          src={toursBanner}
          className="w-full sm:h-[250px] h-[200px] object-cover"
        />
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 font-bold lg:text-6xl md:text-5xl sm:text-5xl min-[420px]:text-4xl text-3xl text-background shadow">
          {t("tours")}
        </h1>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 grid md:grid-cols-4 sm:grid-cols-3 min-[420px]:grid-cols-2 grid-cols-1 gap-x-4 gap-y-8 sm:pt-12 pt-6">
        <h2 className="lg:text-lg sm:text-base text-sm font-semibold text-left col-span-full">
          {t("tours-desc")}
        </h2>
        {[1,2,3,4].map((i) => { return <Skeleton key={i} className="w-full col-span-1 h-[250px]"/>})}
      </div>
    </main>
  );
}
