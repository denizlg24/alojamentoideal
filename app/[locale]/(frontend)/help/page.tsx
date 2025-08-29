import { ContactForm } from "@/components/contact/contact-form";
import { ContactSearchBar } from "@/components/contact/contact-search-bar";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { PopularArticles } from "./popular-articles";

export async function generateMetadata() {
  const t = await getTranslations("metadata");

  return {
    title: t("contact.title"),
    description: t("contact.description"),
    keywords: t("contact.keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      title: t("contact.title"),
      description: t("contact.description"),
      url: "https://alojamentoideal.com/help",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("contact.title"),
      description: t("contact.description"),
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
  const t = useTranslations("contact");
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16 sm:pt-12 pt-6">
      <div className="w-full relative flex flex-col text-left max-w-5xl mx-auto sm:gap-12 gap-8 px-4">
        <h1 className="text-center mx-auto lg:text-4xl md:text-3xl sm:text-2xl text-xl font-bold">
          {t("how-can-we-help")}
        </h1>
        <div className="w-full mx-auto max-w-3xl">
          <ContactSearchBar
            placeholder={t("search-bar-placeholder")}
            readMore={t("read-more")}
          />
        </div>
        <div className="flex flex-col gap-2 w-full items-start">
          <h2 className="lg:text-2xl md:text-xl text-lg font-semibold">
            {t("popular-articles")}
          </h2>
          <div className="w-full grid lg:grid-cols-4 sm:grid-cols-3 grid-cols-2 sm:gap-4 gap-2">
            <PopularArticles />
          </div>
        </div>
        <div className="flex flex-col gap-1 w-full items-start">
          <h2 className="lg:text-2xl md:text-xl text-lg font-semibold">
            {t("didnt-find")}
          </h2>
          <h3 className="lg:text-lg md:text-base text-sm font-medium">
            {t("send-us-a-msg")}
          </h3>
          <div className="mt-3"></div>
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
