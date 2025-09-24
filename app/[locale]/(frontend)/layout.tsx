import { Locale, NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Montserrat } from "next/font/google";
import { Header } from "@/components/header/header";
import "../../globals.css";
import { Footer } from "@/components/footer/footer";
import { CartProvider } from "@/hooks/cart-context";
import { Toaster } from "@/components/ui/sonner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "metadata",
  });
  return {
    title: t("not_found.title") || "Room Not Found | Alojamento Ideal",
    description:
      t("not_found.description") ||
      "The room you’re looking for does not exist or is no longer available.",
    robots: "noindex, nofollow",
    openGraph: {
      title: t("not_found.title") || "Page Not Found - Alojamento Ideal",
      description:
        t("not_found.description") ||
        "Sorry, we couldn’t find the accommodation you’re looking for.",
      url: "https://alojamentoideal.pt/rooms/not-found",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t("not_found.title") || "Room Not Found - Alojamento Ideal",
      description:
        t("not_found.description") ||
        "This room is no longer available or may have been removed.",
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
      {/* eslint-disable-next-line @next/next/no-page-custom-font*/}
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap"
        rel="stylesheet"
        precedence="default"
      />
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
