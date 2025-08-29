"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { Separator } from "@radix-ui/react-separator";
import { useTranslations } from "next-intl";

export const Footer = () => {
  const t = useTranslations("header");
  const pathname = usePathname();
  if (pathname.startsWith("/admin/dashboard")) {
    return null;
  }
  return (
    <footer className="bg-accent p-4 sm:py-12 py-6 w-full flex flex-col items-center mt-auto">
      <div className="w-full sm:grid sm:gap-4 flex flex-col grid-cols-3 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 text-sm ">
          <h3 className="font-semibold">{t("support")}</h3>
          <Link href={"/faq"}>FAQ</Link>
          <Link href={"/help"}>{t("contact")}</Link>
        </div>
        <Separator className="sm:hidden block my-6 w-full h-[1px] bg-accent-foreground/25" />
        <div className="flex flex-col gap-4 text-sm">
          <h3 className="font-semibold">{t("homes-tours")}</h3>
          <Link href={"/rooms"}>{t("homes")}</Link>
          <Link href="/tours/porto-city">{t("porto-exp")}</Link>

          <Link href="/tours/douro">{t("douro-exp")}</Link>

          <Link href="/tours/arouca">{t("arouca-exp")}</Link>

          <Link href="/tours/geres">{t("geres-exp")}</Link>

          <Link href="/tours/others">{t("other-exp")}</Link>
        </div>
        <Separator className="sm:hidden block my-6 w-full h-[1px] bg-accent-foreground/25" />
        <div className="flex flex-col gap-4 text-sm">
          <h3 className="font-semibold">Alojamento Ideal</h3>
          <Link href={"/about"}>{t("about")}</Link>
          <Link href={"/owner"}>{t("property-owner")}</Link>
        </div>
      </div>
      <Separator className="mt-6 mb-6 w-full h-[1px] bg-accent-foreground/25 max-w-7xl" />
      <div className="w-full max-w-7xl text-sm flex sm:flex-row flex-col gap-2 sm:items-center">
        <p>&copy; {new Date().getFullYear()} Alojamento Ideal</p>
        <div className="w-[2px] h-[2px] bg-accent-foreground rounded-full sm:block hidden"></div>
        <Link href={"/privacy"}>{t("privacy")}</Link>
      </div>
    </footer>
  );
};
