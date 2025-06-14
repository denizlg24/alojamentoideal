"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { CiGlobe } from "react-icons/ci";
import { routing } from "@/i18n/routing";
import { CircleFlag } from "react-circle-flags";

export const LocaleSwitcherSelect = ({
  defaultValue,
}: {
  defaultValue: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [currentLocale, updateLocale] = useState(defaultValue);
  const [canBeOpen, setCanBeOpen] = useState(false);

  const getLanguageName = (localeCode: string) => {
    const displayNames = new Intl.DisplayNames([localeCode], {
      type: "language",
    });
    const word = displayNames.of(localeCode);
    if (!word) {
      return word;
    }
    return word[0].toUpperCase() + word.substr(1).toLowerCase();
  };

  return (
    <Popover
      open={canBeOpen}
      onOpenChange={(e) => {
        setCanBeOpen(e);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          disabled={isPending}
          variant="outline"
          className="p-2! rounded-full aspect-square h-auto"
        >
          <CiGlobe className="w-full h-full" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-70 flex flex-col z-99">
        {routing.locales.map((locale) => {
          return (
            <Button
              onClick={() => {
                setCanBeOpen(false);
                updateLocale(locale);
                startTransition(() => {
                  //@ts-expect-error params always match
                  router.replace({ pathname, params }, { locale });
                });
              }}
              disabled={locale === currentLocale}
              key={locale}
              variant={locale === currentLocale ? "outline" : "ghost"}
              className="flex flex-row items-center relative"
            >
              <div className="relative w-5 h-5 justify-self-start">
                <CircleFlag
                  countryCode={locale == "en" ? "us" : locale}
                  height="24"
                />
              </div>
              <p className="grow"> {getLanguageName(locale)}</p>
            </Button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};
