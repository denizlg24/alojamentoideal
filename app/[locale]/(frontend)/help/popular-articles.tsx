"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getArticlesByLocale } from "@/utils/help-articles";
import { SquareArrowOutUpRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
export const PopularArticles = () => {
  const locale = useLocale();
  const t = useTranslations("contact");
  return (
    <>
      {getArticlesByLocale(locale).map((article, indx) => {
        if (indx > 2) {
          return;
        }
        return (
          <div
            key={article.id}
            className="col-span-1 flex flex-col gap-1 text-left items-start h-full"
          >
            <Image
              src={article.photo}
              alt={article.title}
              className="w-full aspect-video h-auto object-cover"
            />
            <h1 className="text-sm font-bold line-clamp-1">{article.title}</h1>
            <p className="text-xs font-normal line-clamp-3">
              {article.preview}...
            </p>
            <Button
              className="w-fit! text-xs p-1! px-2! rounded! h-fit! justify-self-end"
              asChild
            >
              <Link href={`/help/${article.id}`}>
                {t("read-more")} <SquareArrowOutUpRight />
              </Link>
            </Button>
          </div>
        );
      })}
    </>
  );
};
