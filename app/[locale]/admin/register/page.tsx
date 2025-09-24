import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { RegisterForm } from "./register-form";
import { useTranslations } from "next-intl";

export async function generateMetadata() {
  const t = await getTranslations("metadata");

  return {
    title: t("adminRegister.title"),
    description: t("adminRegister.description"),
    keywords: t("adminRegister.keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      title: t("adminRegister.title"),
      description: t("adminRegister.description"),
      url: "https://alojamentoideal.pt/admin/register",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("adminRegister.title"),
      description: t("adminRegister.description"),
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
            <CardTitle>{t("create-account")}</CardTitle>
            <CardDescription>{t("create-account-desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
