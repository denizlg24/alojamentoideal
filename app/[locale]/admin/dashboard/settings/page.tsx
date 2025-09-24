import { getHostkitApiKeyCount } from "@/app/actions/getHostkitApiKeyCount";
import { getListingHostkitApiKey } from "@/app/actions/getListingHostkitApiKey";
import { Card, CardTitle } from "@/components/ui/card";
import { ListingType } from "@/schemas/listing.schema";
import { hostifyRequest } from "@/utils/hostify-request";

import { getTranslations, setRequestLocale } from "next-intl/server";
import { HostKitApiCard } from "./hostkit-api-card";
export async function generateMetadata() {
  const t = await getTranslations("metadata");

  return {
    title: t("adminDashboard.title"),
    description: t("adminDashboard.description"),
    keywords: t("adminDashboard.keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      title: t("adminDashboard.title"),
      description: t("adminDashboard.description"),
      url: "https://alojamentoideal.pt/admin/dashboard/inbox",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("adminDashboard.title"),
      description: t("adminDashboard.description"),
    },
  };
}

export default async function Home({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const listings = await hostifyRequest<{
    listings: ListingType[];
    total: number;
  }>("listings", "GET", undefined, undefined, undefined, {
    page: 1,
    perPage: 80,
  });
  const apiKeys = await getHostkitApiKeyCount();
  return (
    <div className="flex flex-col w-full h-full bg-muted pt-4 px-4 gap-4">
      <Card className="p-4 flex flex-col gap-2 w-fit">
        <CardTitle className="text-sm font-normal">
          HostKit API Coverage
        </CardTitle>
        <p className="lg:text-4xl md:text-3xl sm:text-2xl text-xl font-bold">
          {apiKeys}/{listings.total}
        </p>
      </Card>
      <div className="w-full grid lg:grid-cols-6 md:grid-cols-5 sm:grid-cols-4 min-[420px]:grid-cols-3 grid-cols-2 justify-start items-stretch gap-4">
        {await Promise.all(
          listings.listings.map(async (listing) => {
            const apiKey = await getListingHostkitApiKey(listing.id.toString());
            return (
              <HostKitApiCard
                key={listing.id}
                apiKey={apiKey}
                listing={listing}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
