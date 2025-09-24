import { FAQ } from "@/components/faq/faq";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

export async function generateMetadata() {
  const t = await getTranslations("metadata");

  return {
    title: t("faq.title"),
    description: t("faq.description"),
    keywords: t("faq.keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      title: t("faq.title"),
      description: t("faq.description"),
      url: "https://alojamentoideal.pt/faq",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("faq.title"),
      description: t("faq.description"),
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
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16 sm:pt-12 pt-6">
      <div className="w-full relative flex flex-col text-left max-w-5xl mx-auto gap-8 px-4">
        <h1 className="lg:text-4xl md:text-3xl sm:text-2xl text-xl font-bold">
          FAQ
        </h1>
        <FAQ />
      </div>
    </main>
  );
}
