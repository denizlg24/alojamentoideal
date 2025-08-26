"use client";

import countries, { alpha2ToAlpha3 } from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import flags from "react-phone-number-input/flags";
import { Country } from "react-phone-number-input";
import { cn } from "@/lib/utils";

countries.registerLocale(enLocale);

export function CountrySelect({
  onChange,
  defaultValue,
  className,
  value,
}: {
  value?: string;
  onChange?: (code: string) => void;
  defaultValue?: string;
  className?: string;
}) {
  const countryObj = countries.getNames("en", { select: "official" }); // { "AF": "Afghanistan", "AL": "Albania", ... }
  const entries = Object.entries(countryObj); // [ ["AF", "Afghanistan"], ... ]

  return (
    <Select
      defaultValue={defaultValue}
      value={value}
      onValueChange={(val) => onChange?.(val)}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select a country" />
      </SelectTrigger>
      <SelectContent className={cn("z-99 w-fit!", className)} side="bottom">
        {entries.map(([code, name]) => {
          const Flag = flags[code as Country];
          return (
            <SelectItem key={code} value={alpha2ToAlpha3(code) || code}>
              {Flag && <Flag title={name} />} {name}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
