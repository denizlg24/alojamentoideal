import { getAdminOrder } from "@/app/actions/getAdminOrder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localeMap } from "@/lib/utils";
import { CustomFieldType } from "@/schemas/custom-field.schema";
import { ListingType } from "@/schemas/listing.schema";
import { ReservationType } from "@/schemas/reservation.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { format } from "date-fns";
import { LucideSquareArrowOutUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { GetReservationStatus } from "./reservationStatus";
import { Separator } from "@/components/ui/separator";

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
  const { locale, id } = await params;
  setRequestLocale(locale);
  const propertyCardT = await getTranslations("propertyCard");

  const order = await getAdminOrder(id);
  if (!order) {
    return;
  }
  const reservations = await Promise.all(
    order.reservationIds?.map(async (reservation_id) => {
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

      const orderItem = order.items
        .filter((item) => item.type == "accommodation")
        .find((item) => item.property_id == listingInfo.listing.id);
      return {
        listing: listingInfo.listing,
        reservation: reservationInfo.reservation,
        orderItem,
        guestInfoCustomField,
        guestInfoCustomDoneField,
      };
    })
  );

  const getPaymentStatus = (paymentStatus: string) => {
    let status = <></>;
    switch (paymentStatus) {
      case "canceled":
        status = (
          <div className="flex flex-row items-center justify-start gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive"></div>
            <p>Canceled</p>
          </div>
        );
        break;
      case "processing":
        status = (
          <div className="flex flex-row items-center justify-start gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <p>Processing</p>
          </div>
        );
        break;
      case "requires_action":
        status = (
          <div className="flex flex-row items-center justify-start gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <p>Waiting action</p>
          </div>
        );
        break;
      case "requires_capture":
        status = (
          <div className="flex flex-row items-center justify-start gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <p>Waiting capture</p>
          </div>
        );
        break;
      case "requires_confirmation":
        status = (
          <div className="flex flex-row items-center justify-start gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <p>Waiting confirmation</p>
          </div>
        );

        break;
      case "requires_payment_method":
        status = (
          <div className="flex flex-row items-center justify-start gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive"></div>
            <p>Card declined</p>
          </div>
        );
        break;
      case "succeeded":
        status = (
          <div className="flex flex-row items-center justify-start gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <p>Succeeded</p>
          </div>
        );
        break;
      case "not-found":
        status = (
          <div className="flex flex-row items-center justify-start gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive"></div>
            <p>Not found</p>
          </div>
        );
        break;
    }
    return status;
  };

  return (
    <div className="flex flex-col w-full h-full bg-muted">
      <div className="w-full lg:grid lg:grid-cols-5 flex flex-col justify-start items-start gap-4 pt-4 px-4">
        <div className="flex flex-col gap-0 w-full col-span-full h-fit!">
          <div className="flex flex-row gap-2 items-center">
            <h1 className="lg:text-2xl md:text-xl text-lg font-bold">
              #{order.orderId}
            </h1>
            <Card className="p-1 rounded!">
              {getPaymentStatus(order.payment_id.status)}
            </Card>
          </div>
          <h2 className="md:text-base text-sm font-medium">
            {format(order.createdAt, "MMM dd, yyyy - h:mm bbb")}
          </h2>
        </div>
        <div className="w-full col-span-2 flex flex-col gap-4 order-2">
          <Card className="w-full flex flex-col gap-2 p-4">
            <div className="flex flex-row items-center justify-between text-sm w-full relative">
              <p className="font-bold">Order ID</p>
              <p className="font-normal max-w-[60%] truncate">
                #{order.orderId}
              </p>
            </div>
            <div className="col-span-3 w-full flex flex-col gap-4">
              <Separator />
              <div className="flex flex-row items-center justify-between text-sm">
                <p className="font-bold">Created at</p>
                <p className="">
                  {format(new Date(order.createdAt), "yyyy-MM-dd hh:mm")}
                </p>
              </div>
              <Separator />
              <div className="w-full flex flex-col gap-2">
                <div className="flex flex-row items-center justify-between text-sm">
                  <p className="font-bold">Client name</p>
                  <p className="max-w-[60%] truncate">{order.name}</p>
                </div>
                <div className="flex flex-row items-center justify-between text-sm">
                  <p className="font-bold">Client email</p>
                  <p className="max-w-[60%] truncate">{order.email}</p>
                </div>
                <div className="flex flex-row items-center justify-between text-sm">
                  <p className="font-bold">Client phone</p>
                  <p className="max-w-[60%] truncate">{order.phoneNumber}</p>
                </div>
                <div className="flex flex-row items-center justify-between text-sm">
                  <p className="font-bold">Notes</p>
                  <p className="max-w-[60%] truncate">{order.notes}</p>
                </div>
              </div>
              <Separator />
              <div className="w-full flex flex-col gap-2">
                <p className="font-bold text-sm">Price breakdown</p>
                <div className="flex flex-col gap-1 w-full">
                  {order.items.map((item) => {
                    if (item.type == "accommodation") {
                      return (
                        <div
                          key={item.property_id}
                          className="w-full flex flex-col gap-0"
                        >
                          <p className="font-semibold text-sm">{item.name}</p>
                          <div className="w-full flex flex-col gap-0 ml-1">
                            {item.fees.map((fee) => {
                              return (
                                <div
                                  key={fee.fee_id}
                                  className="w-full flex flex-row items-center justify-between text-sm"
                                >
                                  <p className="font-medium">
                                    - {fee.fee_name}
                                  </p>
                                  <p className="">{fee.total}€</p>
                                </div>
                              );
                            })}
                            <div className="flex flex-row items-center justify-between text-sm">
                              <p className="font-normal">Total:</p>
                              <p className="">{item.front_end_price}€</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                  <div className="flex flex-row items-center justify-between text-sm">
                    <p className="font-bold">
                      Order total{" "}
                      <span className="font-normal">
                        ({order.items.length})
                      </span>
                    </p>
                    <p className="">
                      {order.items.reduce((total, item) => {
                        if (item.type === "accommodation") {
                          return total + item.front_end_price;
                        } else {
                          return total + item.quantity * item.price;
                        }
                      }, 0)}
                      €
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="col-span-3 flex flex-col gap-4 order-1 w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Associated Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              {reservations.map((reservation) => {
                const arrayIndx = order.reservationIds.findIndex(
                  (indx) => indx == reservation.reservation.id.toString()
                );
                return (
                  <div
                    key={reservation.reservation.id}
                    className="flex flex-col gap-0 w-full items-start"
                  >
                    <GetReservationStatus
                      reservation={reservation.reservation}
                      guestInfoCustomField={reservation.guestInfoCustomField}
                      guestInfoCustomDoneField={
                        reservation.guestInfoCustomDoneField
                      }
                      transaction_id={order.transaction_id[arrayIndx]}
                    />
                    <div className="text-left text-sm font-bold">
                      <Button className="p-0! h-fit!" variant={"link"} asChild>
                        <Link
                          href={`https://go.hostify.com/reservations/view/${reservation.reservation.id}`}
                        >
                          <span className="font-semibold">
                            Confirmation Code:{" "}
                            {reservation.reservation.confirmation_code}
                          </span>
                          <LucideSquareArrowOutUpRight />
                        </Link>
                      </Button>
                    </div>
                    <div className="pb-2 border-b-2 border-muted border-dotted flex flex-row items-start gap-2 w-full mt-0.5">
                      <div className="w-[15%] md:block hidden shrink-0 h-auto aspect-video relative overflow-hidden rounded">
                        <Image
                          src={reservation.listing.thumbnail_file}
                          alt="photo"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="grow flex min-[550px]:flex-row flex-col justify-between gap-1 text-sm">
                        <div className="min-[550px]:w-fit min-[550px]:flex-1 flex flex-col gap-1 items-start">
                          <p className="font-bold truncate">
                            {reservation.listing.name}
                          </p>
                          <div className="gap-8 grid grid-cols-2 relative h-fit! w-fit">
                            <div className="col-span-1 flex flex-col">
                              <p className="text-sm font-medium">Arriving</p>
                              <p className="text-xs font-normal">
                                {format(
                                  new Date(reservation.reservation.checkIn),
                                  "EEE, MMM dd",
                                  {
                                    locale:
                                      localeMap[
                                        locale as keyof typeof localeMap
                                      ],
                                  }
                                )}
                              </p>
                            </div>
                            <div className="absolute left-1/2 -translate-x-1/2 h-[60%] w-[0.5px] bg-muted-foreground/50 top-1/2 -translate-y-1/2"></div>
                            <div className="col-span-1 flex flex-col text-right">
                              <p className="text-sm font-medium">Leaving</p>
                              <p className="text-xs font-normal">
                                {format(
                                  new Date(reservation.reservation.checkOut),
                                  "EEE, MMM dd",
                                  {
                                    locale:
                                      localeMap[
                                        locale as keyof typeof localeMap
                                      ],
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs">
                            {propertyCardT("guests", {
                              adults: reservation.orderItem?.adults ?? 0,
                              children:
                                (reservation.orderItem?.children ?? 0) > 0
                                  ? propertyCardT("children_text", {
                                      count:
                                        reservation.orderItem?.children ?? 0,
                                    })
                                  : "",
                              infants:
                                (reservation.orderItem?.infants ?? 0) > 0
                                  ? propertyCardT("infants_text", {
                                      count:
                                        reservation.orderItem?.infants ?? 0,
                                    })
                                  : "",
                            })}
                          </p>
                        </div>
                        <div className="min-[550px]:w-fit shrink-0 flex flex-col gap-0 ml-1">
                          {reservation.orderItem?.fees.map((fee) => {
                            return (
                              <div
                                key={fee.fee_id}
                                className="w-full flex flex-row items-center justify-between text-sm gap-2"
                              >
                                <p className="font-medium">- {fee.fee_name}</p>
                                <p className="">{fee.total}€</p>
                              </div>
                            );
                          })}
                          <div className="flex flex-row items-center justify-between text-sm">
                            <p className="font-normal">Total:</p>
                            <p className="">
                              {reservation.orderItem?.front_end_price}€
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
