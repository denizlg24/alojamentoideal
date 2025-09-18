import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import regras_amenidade from "@/public/regras-tostas.webp";
import regras_espelho from "@/public/regras-espelho.webp";
import regras_livros from "@/public/regras-livro.webp";
import regras_refeicao from "@/public/amar-outside.webp";
import Image from "next/image";
import leca_view from "@/public/leça-view.jpg";
import porto_view from "@/public/porto-view.jpg";
import povoa_view from "@/public/povoa-view.jpg";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
export async function generateMetadata() {
  const t = await getTranslations("metadata");

  return {
    title: t("about.title"),
    description: t("about.description"),
    keywords: t("about.keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      title: t("about.title"),
      description: t("about.description"),
      url: "https://alojamentoideal.com/faq",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("about.title"),
      description: t("about.description"),
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

  const t = useTranslations("about");

  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16 sm:pt-12 pt-6">
      <div className="w-full relative flex flex-col text-left max-w-6xl mx-auto min-[420px]:px-4 gap-8">
        <div className="w-full min-[420px]:flex-row items-center flex flex-col gap-8">
          <div className="flex flex-col gap-4 flex-[2] min-[420px]:px-0 px-4">
            <h1 className="lg:text-4xl md:text-3xl sm:text-2xl text-xl font-bold">
              {t("about-title")}
            </h1>
            <h3 className="lg:text-xl md:text-lg text-base font-semibold">
              {t("who-are-we")}
            </h3>
            <h2 className="lg:text-lg md:text-base text-sm font-normal">
              {t("about-desc")}
            </h2>
          </div>
          <div className="w-full flex-[1.5]  min-[420px]:h-full h-[200px] items-center flex justify-center min-[420px]:rounded-xl overflow-hidden shadow-lg">
            <Image unoptimized 
              src={regras_espelho}
              alt={"Amar Outside View"}
              className="object-cover w-full h-full object-[25%_50%]"
            />
          </div>
        </div>
        <div className="w-full min-[420px]:flex-row items-center flex flex-col-reverse gap-8">
          <div className="w-full flex-[1.5] col-span-2 min-[420px]:h-full h-[200px] items-center flex justify-center min-[420px]:rounded-xl overflow-hidden shadow-lg">
            <Image unoptimized 
              src={regras_livros}
              alt={"Amar Outside View"}
              className="object-cover w-full h-full object-[50%_50%]"
            />
          </div>
          <div className="flex flex-[2] flex-col gap-4 sm:col-span-3 col-span-2 min-[420px]:px-0 px-4">
            <h3 className="lg:text-xl md:text-lg text-base font-semibold">
              {t("our-story")}
            </h3>
            <h2 className="lg:text-lg md:text-base text-sm font-normal">
              {t("story-desc")}
            </h2>
          </div>
        </div>
        <div className="w-full min-[420px]:flex-row items-center flex flex-col gap-8">
          <div className="flex flex-[2] flex-col gap-4 sm:col-span-3 col-span-2 min-[420px]:px-0 px-4">
            <h3 className="lg:text-xl md:text-lg text-base font-semibold">
              {t("where-are-we")}
            </h3>
            <h2 className="lg:text-lg md:text-base text-sm font-normal">
              {t("where-desc")}
            </h2>
          </div>
          <div className="w-full flex-[1.5] col-span-2 min-[420px]:h-full h-[200px] min-[420px]:grid flex flex-row items-center grid-cols-2 gap-2 min-[420px]:rounded-xl min-[420px]:overflow-hidden overflow-x-clip min-[420px]:shadow-lg">
            <Image unoptimized 
              src={leca_view}
              alt={"Amar Outside View"}
              className="object-cover min-[420px]:rounded-none min-[420px]:w-auto w-1/3 shrink-0 min-[420px]:h-auto h-full object-[50%_50%] col-span-full rounded-r-md min-[420px]:shadow-none shadow-lg"
            />
            <Image unoptimized 
              src={porto_view}
              alt={"Amar Outside View"}
              className="object-cover min-[420px]:rounded-none min-[420px]:w-auto w-1/3 shrink-0 min-[420px]:h-auto min-[420px]:aspect-[1.33] h-full object-[25%_50%] rounded-md min-[420px]:shadow-none shadow-lg"
            />
            <Image unoptimized 
              src={povoa_view}
              alt={"Amar Outside View"}
              className="object-cover min-[420px]:rounded-none min-[420px]:w-auto w-1/3 shrink-0 min-[420px]:h-auto min-[420px]:aspect-[1.33] h-full object-[20%_50%] rounded-l-md min-[420px]:shadow-none shadow-lg"
            />
          </div>
        </div>
        <div className="w-full min-[420px]:flex-row items-center flex flex-col-reverse gap-8">
          <div className="w-full flex-[1.5] col-span-2 min-[420px]:h-full h-[200px] items-center flex justify-center min-[420px]:rounded-xl overflow-hidden shadow-lg">
            <Image unoptimized 
              src={regras_amenidade}
              alt={"Amar Outside View"}
              className="object-cover w-full h-full object-[50%_50%]"
            />
          </div>
          <div className="flex flex-[2] flex-col gap-4 sm:col-span-3 col-span-2 min-[420px]:px-0 px-4">
            <h3 className="lg:text-xl md:text-lg text-base font-semibold">
              {t("why-stay")}
            </h3>
            <ul className="pl-8 w-full list-disc">
              <li className="lg:text-lg md:text-base text-sm font-normal">
                {t("why-stay-l1")}
              </li>
              <li className="lg:text-lg md:text-base text-sm font-normal">
                {t("why-stay-l2")}
              </li>
              <li className="lg:text-lg md:text-base text-sm font-normal">
                {t("why-stay-l3")}
              </li>
              <li className="lg:text-lg md:text-base text-sm font-normal">
                {t("why-stay-l4")}
              </li>
            </ul>
          </div>
        </div>

        <div className="w-full flex flex-col gap-8 max-w-xl mx-auto mt-8">
          <div className="flex flex-col gap-1 w-full items-center text-center">
            <p className="lg:text-2xl md:text-xl text-lg font-bold">
              {t("ready-part-1")}
            </p>
            <p className="lg:text-xl md:text-lg text-base font-semibold">
              {t("ready-part-2")}
            </p>
            <Button className="mt-6" size={"lg"}>
              <Link href={"/rooms"}>{t("find-your-stay")}</Link>
            </Button>
          </div>
          <Image unoptimized 
            src={regras_refeicao}
            alt="Regras Refeição"
            className="w-full aspect-video h-auto min-[420px]:rounded-xl shadow-lg"
          />
        </div>
      </div>
    </main>
  );
}
