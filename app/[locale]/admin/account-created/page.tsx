import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { HomeIcon, ShieldEllipsis } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";

export async function generateMetadata() {
  const t = await getTranslations("metadata");

  return {
    title: t("adminAccountCreated.title"),
    description: t("adminAccountCreated.description"),
    keywords: t("adminAccountCreated.keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      title: t("adminAccountCreated.title"),
      description: t("adminAccountCreated.description"),
      url: "https://alojamentoideal.pt/admin/account-created",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("adminAccountCreated.title"),
      description: t("adminAccountCreated.description"),
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
  const t = useTranslations("account-created");
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16 sm:pt-12 pt-6">
      <div className="w-full relative flex flex-col text-left max-w-xl mx-auto gap-8 px-4">
        <Card className="p-4">
          <CardHeader className="items-center text-center">
            <ShieldEllipsis className="text-amber-600 mx-auto h-12 w-auto aspect-square" />
            <CardTitle>{t("account-request-made")}</CardTitle>
            <CardDescription>
              {t("account-request-made-description")}
            </CardDescription>
          </CardHeader>
          <CardAction className="w-full">
            <Button className="w-full" asChild>
              <Link href={"/"}>
                <HomeIcon />
                {t("back-to-home")}
              </Link>
            </Button>
          </CardAction>
        </Card>
      </div>
    </main>
  );
}
