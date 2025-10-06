"use client";
import Image from "next/image";
import illust from "@/public/403_illust.jpg";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Error({ error }: { error: Error }) {
  const t = useTranslations("not-found");
  if (error.message == 'Unauthorized') {
    return (
        <main className="w-full flex flex-col items-center max-w-7xl px-4 mx-auto">
          <div className="w-full max-w-4xl md:grid flex flex-col grid-cols-3 my-12 md:gap-4 gap-6">
            <div className="col-span-2 w-full flex flex-col md:items-start items-center md:text-left text-center gap-4">
              <h1 className="font-bold text-4xl">{t("oops")}</h1>
              <h2 className="text-xl">{t("unauthenticated")}</h2>
              <p>{t("error")} 403</p>
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
              <Image unoptimized  src={illust} alt="403 illustration" className="object-contain" fill />
            </div>
          </div>
        </main>
      );
  }

  return (
    <div>
      <h1>Something went wrong</h1>
      <p>Please try again later.</p>
    </div>
  );
}