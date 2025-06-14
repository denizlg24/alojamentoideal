import { useLocale } from "next-intl";
import { LocaleSwitcherSelect } from "./locale-switcher-select";

export const LocaleSwitcher = () => {
  const locale = useLocale();
  return <LocaleSwitcherSelect defaultValue={locale} />;
};
