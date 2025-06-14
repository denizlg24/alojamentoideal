import { NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Montserrat } from "next/font/google";
import { Header } from "@/components/header/header";
import "./globals.css";
import { Footer } from "@/components/footer/footer";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("not-found") };
}

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <html lang={locale}>
      <body
        className={`antialiased ${montserrat.variable} w-full min-h-screen flex flex-col items-center justify-start sm:pt-16 pt-12`}
      >
        <NextIntlClientProvider>
          <Header />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
