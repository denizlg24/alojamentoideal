import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { use } from "react";
import illust from "@/public/404_illustration.svg";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
export default function NotFound({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const { locale } = use<{ locale: string }>(params);

  setRequestLocale(locale);

  const t = useTranslations("not-found");

  return (
    <main className="w-full flex flex-col items-center max-w-7xl px-4 mx-auto">
      <div className="w-full max-w-4xl md:grid flex flex-col grid-cols-3 my-12 md:gap-4 gap-6">
        <div className="col-span-2 w-full flex flex-col md:items-start items-center md:text-left text-center gap-4">
          <h1 className="font-bold text-4xl">{t("oops")}</h1>
          <h2 className="text-xl">{t("subtitle")}</h2>
          <p>{t("error")} 404</p>
          <div className="flex flex-col gap-1 text-sm">
            <p>{t("cta")}</p>
            <Link className="text-primary" href={"/"}>
              {t("home")}
            </Link>
            <Link className="text-primary" href={"/rooms"}>
              {t("homes")}
            </Link>
            <Link className="text-primary" href={"/tours"}>
              {t("tours")}
            </Link>
          </div>
        </div>
        <div className="col-span-1 w-full relative min-h-[250px]">
          <Image src={illust} alt="404 illustration" fill />
        </div>
      </div>
    </main>
  );
}
