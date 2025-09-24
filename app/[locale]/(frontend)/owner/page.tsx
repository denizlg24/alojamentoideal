import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { use } from "react";
import amar from "@/public/amar-outside.webp";
import vertical from "@/public/regras-espelho.webp";
import { OwnerContactCard } from "./owner-contact-card";

export async function generateMetadata() {
  const t = await getTranslations("metadata");

  return {
    title: t("owner.title"),
    description: t("owner.description"),
    keywords: t("owner.keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      title: t("owner.title"),
      description: t("owner.description"),
      url: "https://alojamentoideal.pt/privacy",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("owner.title"),
      description: t("owner.description"),
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
  const t = useTranslations("owner");

  return (
    <main className="flex flex-col items-center w-full mx-auto xl:min-h-screen mb-16 sm:pt-12 pt-6 min-[420px]:px-4 px-0 relative gap-12">
      <div className="flex flex-col gap-4 min-[420px]:px-0 px-4 w-full max-w-7xl">
        <h1 className="lg:text-4xl md:text-3xl sm:text-2xl text-xl font-bold">
          {t("headline")}
        </h1>
        <h2 className="lg:text-xl md:text-lg text-base font-semibold">
          {t("subtitle")}
        </h2>
      </div>
      <div className="absolute xl:block hidden left-0 top-1/4 xl:w-[70%] w-full overflow-hidden xl:rounded-br-4xl -z-10 shadow-2xl">
        <Image unoptimized 
          src={amar}
          alt="amar"
          className="w-full h-auto object-cover aspect-[2.5]"
        />
      </div>
      <div className="w-full max-w-6xl flex flex-row xl:justify-end justify-center">
        <OwnerContactCard />
      </div>

      <div className="absolute xl:block hidden right-0 xl:top-1/8 bottom-1/8 xl:w-[25%] w-full overflow-hidden xl:rounded-tl-4xl -z-10 shadow-2xl">
        <Image unoptimized 
          src={vertical}
          alt="amar"
          className="w-full h-auto object-cover xl:aspect-[0.5] aspect-[2.5] object-[25%_100%]"
        />
      </div>
    </main>
  );
}
