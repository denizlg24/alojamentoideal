import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../../globals.css";
import { CartProvider } from "@/hooks/cart-context";
import { Header } from "@/components/header/header";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/footer/footer";
import { Montserrat } from "next/font/google";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata() {
  const t = await getTranslations("metadata");
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
      url: "https://alojamentoideal.com/rooms/not-found",
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
    return;
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
