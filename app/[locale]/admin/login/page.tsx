import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { LoginForm } from "./login-form";

export async function generateMetadata() {
  const t = await getTranslations("metadata");

  return {
    title: t("adminLogin.title"),
    description: t("adminLogin.description"),
    keywords: t("adminLogin.keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      title: t("adminLogin.title"),
      description: t("adminLogin.description"),
      url: "https://alojamentoideal.com/admin/login",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("adminLogin.title"),
      description: t("adminLogin.description"),
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
  const t = useTranslations("login-register");
  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16 sm:pt-12 pt-6">
      <div className="w-full relative flex flex-col text-left max-w-3xl mx-auto gap-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("login-account")}</CardTitle>
            <CardDescription>{t("login-account-desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
