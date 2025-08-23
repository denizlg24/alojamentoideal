"use client";

import { useTranslations } from "next-intl";
import messagesEN from "@/locales/en.json";

type FAQCategory = keyof typeof messagesEN.faq;
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { ChevronDownIcon } from "lucide-react";

export const FAQ = () => {
  const t = useTranslations("faq");

  const categories: FAQCategory[] = [
    "booking",
    "cancellation",
    "checkin",
    "payments",
    "support",
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      {categories.map((category) => {
        const categoryData = (messagesEN.faq[category] || {}) as Record<
          string,
          string
        >;
        const qaPairs: { qKey: string; aKey: string }[] = [];

        Object.keys(categoryData)
          .filter((k) => k.startsWith("q"))
          .forEach((qKey) => {
            const aKey = "a" + qKey.slice(1);
            if (categoryData[aKey])
              qaPairs.push({
                qKey: `${category}.${qKey}`,
                aKey: `${category}.${aKey}`,
              });
          });

        return (
          <div key={category} className="mb-6">
            <h2 className="text-xl font-semibold mb-2 capitalize">
              {t(category + ".title")}
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {qaPairs.map((pair, idx) => {
                const key = `${category}-${idx}`;
                return (
                  <AccordionItem value={key} key={key}>
                    <AccordionTrigger>
                      {t(pair.qKey)}
                      <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
                    </AccordionTrigger>
                    <AccordionContent className="w-full">
                      <p className="whitespace-pre-line">{t(pair.aKey)}</p>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        );
      })}
    </div>
  );
};
