//import { getAdminOrder } from "@/app/actions/getAdminOrder";
//import { CustomFieldType } from "@/schemas/custom-field.schema";
//import { ListingType } from "@/schemas/listing.schema";
//import { ReservationType } from "@/schemas/reservation.schema";
//import { hostifyRequest } from "@/utils/hostify-request";
import { getTranslations, setRequestLocale } from "next-intl/server";

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
      url: "https://alojamentoideal.com/admin/dashboard/inbox",
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
  const { locale /*id */ } = await params;
  setRequestLocale(locale);
  //const t = await getTranslations("admin-inbox");

  //const order = await getAdminOrder(id);

  /*const reservations = order?.reservationIds.map(async (reservation_id) => {
    const [reservationInfo, customFields] = await Promise.all([
      hostifyRequest<{
        reservation: ReservationType;
      }>(
        `reservations/${reservation_id}`,
        "GET",
        undefined,
        undefined,
        undefined
      ),
      hostifyRequest<{
        success: boolean;
        custom_fields: CustomFieldType[];
      }>(`reservations/custom_fields/${reservation_id}`, "GET"),
    ]);

    const guestInfoCustomField = customFields.custom_fields.find(
      (a) => a.name == "hostkit_url"
    );
    const guestInfoCustomDoneField = customFields.custom_fields.find(
      (b) => b.name == "hostkit_done"
    );

    const listingInfo = await hostifyRequest<{ listing: ListingType }>(
      `listings/${reservationInfo.reservation.listing_id}`,
      "GET"
    );
    return {
      listing: listingInfo.listing,
      reservation: reservationInfo.reservation,
      guestInfoCustomField,
      guestInfoCustomDoneField,
    };
  });*/

  return <div className="w-full flex flex-col gap-4 items-start"></div>;
}
