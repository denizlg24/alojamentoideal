import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Montserrat } from "next/font/google";
import { Header } from "@/components/header/header";
import "../../globals.css";
import { Footer } from "@/components/footer/footer";
import { CartProvider } from "@/hooks/cart-context";
import { Toaster } from "@/components/ui/sonner";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata() {
  const t = await getTranslations("metadata");

  return {
    title: t("home.title"),
    description: t("home.description"),
    keywords: t("home.keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      title: t("home.title"),
      description: t("home.description"),
      url: "https://alojamentoideal.com",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("home.title"),
      description: t("home.description"),
    },
  };
}
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  return (
    <html lang={locale}>
      <body
        className={`antialiased ${montserrat.variable} w-full min-h-screen flex flex-col items-center justify-start sm:pt-16! pt-12!`}
      >
        <CartProvider>
          <NextIntlClientProvider>
            <Header />
            {children}
            <Toaster position="bottom-right" />
            <Footer />
          </NextIntlClientProvider>
        </CartProvider>
      </body>
    </html>
  );
}
