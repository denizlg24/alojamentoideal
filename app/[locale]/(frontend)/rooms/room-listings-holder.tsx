import { FloatingFilter } from "@/components/home/floating-filter";
import { ListingHomeCard } from "@/components/listings/listing-home-card";
import { ListingStayCard } from "@/components/listings/listing-stay-card";
import { RoomsMapHolder } from "@/components/rooms/rooms-map-holder";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ListingType } from "@/schemas/listing.schema";
import { hostifyRequest } from "@/utils/hostify-request";
import { getTranslations } from "next-intl/server";

const getAllListings = async (page: number, perPage: number) => {
  try {
    const listings = await hostifyRequest<{
      listings: ListingType[];
      total: number;
    }>("listings", "GET", undefined, undefined, undefined, {
      page,
      perPage,
    });
    return {
      listings: listings.listings,
      total: listings.total,
      totalPages: Math.ceil(listings.total / perPage),
    };
  } catch {
    return {
      listings: [],
      total: 0,
      totalPages: 0,
    };
  }
};

const getAvailableListings = async (
  page: number,
  perPage: number,
  from: string,
  to: string,
  guests: number
) => {
  try {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const allValidListings: ListingType[] = [];
    const listings = await hostifyRequest<{
      listings: ListingType[];
      total: number;
      nextPage?: string;
    }>(
      `listings/available?start_date=${from}&end_date=${to}`,
      "GET",
      [
        { key: "guests", value: guests },
        { key: "include_fees", value: 1 },
        { key: "min_rating", value: 0 },
      ],
      undefined,
      undefined,
      {
        includeRelated: 1,
        page: 1,
        perPage: 80,
      }
    );
    const filtered = listings.listings.filter((l) => l.price > 0);
    allValidListings.push(...filtered);

    const paginated = allValidListings.slice(start, end);

    const filteredTotal = allValidListings.length;
    const pageCount = Math.ceil(filteredTotal / perPage);

    return {
      total: filteredTotal,
      totalPages: pageCount,
      listings: paginated,
    };
  } catch {
    return {
      total: 0,
      totalPages: 0,
      listings: [],
    };
  }
};

export async function RoomListingHolder({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const _searchParams = await searchParams;
  const page = Number(_searchParams.page) || 1;
  const perPage = 24;

  const from = _searchParams.from as string | undefined;
  const to = _searchParams.to as string | undefined;

  const adults = Number(_searchParams.adults || 1);
  const children = Number(_searchParams.children || 0);
  const infants = Number(_searchParams.infants || 0);
  const pets = Number(_searchParams.pets || 0);

  const { total, totalPages, listings } =
    from && to
      ? await getAvailableListings(page, perPage, from, to, adults + children)
      : await getAllListings(page, perPage);
  const buildHref = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("adults", adults.toString());
    params.set("children", children.toString());
    params.set("infants", infants.toString());
    params.set("pets", pets.toString());
    return `?${params.toString()}`;
  };
  const currentHref = buildHref();
  const t = await getTranslations("rooms");

  return (
    <main className="flex flex-col items-center w-full mx-auto md:gap-0 gap-2 mb-16 px-4">
      <div className="w-full fixed z-85 bg-background h-fit p-4 shadow">
        <FloatingFilter initialHref={currentHref} className="max-w-7xl" />
      </div>
      <div className="w-full max-w-7xl md:mt-30 sm:mt-40 mt-52">
        <div className="grid grid-cols-3 items-start w-full gap-6">
          <div className="grid xl:grid-cols-3 min-[500px]:grid-cols-2 grid-cols-1 gap-4 md:col-span-2 col-span-3">
            {!(from || to) && (
              <h1 className="col-span-full md:text-lg sm:text-base text-sm font-normal gap-0 flex flex-col">
                <span>{t("all")}</span>
                <span className="sm:text-sm text-xs text-muted-foreground/50">
                  {t("adjust")}
                </span>
              </h1>
            )}
            {from && to && listings?.length > 0 && (
              <h1 className="col-span-full md:text-lg sm:text-base text-sm font-normal gap-0 flex flex-col">
                <span>
                  {t("showing")}{" "}
                  <span className="font-semibold">
                    {totalPages > 0 ? total : listings?.length}
                  </span>
                  {t("rooms")}
                </span>
                <span className="sm:text-sm text-xs text-muted-foreground/50">
                  {t("showing-info")}
                </span>
              </h1>
            )}
            {listings?.length == 0 && (
              <h1 className="col-span-full md:text-lg sm:text-base text-sm font-normal gap-0 flex flex-col">
                <span>{t("no-rooms")}</span>
                <span className="sm:text-sm text-xs text-muted-foreground/50">
                  {t("no-help")}
                </span>
              </h1>
            )}
            <div className="col-span-full w-full md:hidden flex flex-row items-start h-[300px] rounded-xl shadow overflow-hidden">
              <RoomsMapHolder
                isLoading={false}
                currentHref={currentHref}
                listings={listings}
                filters={{
                  start: from ? new Date(from) : undefined,
                  end: to ? new Date(to) : undefined,
                  adults: adults,
                  children: children,
                  infants: infants,
                  pets: pets,
                }}
              />
            </div>
            {!(from && to) &&
              listings?.map((listing) => {
                return (
                  <ListingHomeCard
                    className={"max-w-full!"}
                    key={listing.id}
                    listing={listing}
                  />
                );
              })}
            {from &&
              to &&
              listings?.map((listing) => {
                return (
                  <ListingStayCard
                    href={currentHref}
                    className={"max-w-full!"}
                    key={listing.id}
                    listing={listing}
                  />
                );
              })}
            {totalPages > 1 && listings?.length > 0 && (
              <div className="col-span-full">
                <PaginationControls
                  className="justify-center"
                  totalPages={totalPages}
                />
              </div>
            )}
          </div>
          <div className="col-span-1 w-full sticky top-44 md:flex hidden flex-row items-start h-[calc(100vh-64px-70px-48px-72px)] mt-16 rounded-xl shadow overflow-hidden">
            <RoomsMapHolder
              isLoading={false}
              currentHref={currentHref}
              listings={listings}
              filters={{
                start: from ? new Date(from) : undefined,
                end: to ? new Date(to) : undefined,
                adults: adults,
                children: children,
                infants: infants,
                pets: pets,
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
