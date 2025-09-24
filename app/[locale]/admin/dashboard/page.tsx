import { getAllOrders } from "@/app/actions/getAllOrders";
import { Card, CardTitle } from "@/components/ui/card";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DataTable } from "./orders-table/orders-table";
import { columns, ITableOrder } from "./orders-table/columns";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

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
      url: "https://alojamentoideal.pt/admin/dashboard",
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

  const { orders, total } = await getAllOrders();

  function getTotals(orders: ITableOrder[]) {
    const now = new Date();

    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const endOfLastWeek = new Date(startOfThisWeek);
    endOfLastWeek.setMilliseconds(-1);

    let total = 0;
    let previousTotal = 0;

    for (const order of orders) {
      const created = new Date(order.createdAt);

      if (created >= startOfThisWeek) {
        total++;
      } else if (created >= startOfLastWeek && created <= endOfLastWeek) {
        previousTotal++;
      }
    }

    return { thisWeek: total, previousTotal };
  }

  const { thisWeek, previousTotal } = getTotals(orders);

  return (
    <div className="w-full flex flex-col gap-4 items-start mt-4 px-4">
      <Card className="p-4 flex flex-col gap-2">
        <CardTitle className="text-sm font-normal">Total orders</CardTitle>
        <p className="lg:text-4xl md:text-3xl sm:text-2xl text-xl font-bold">
          {total}
        </p>
        {previousTotal === 0 ? (
          <p className="text-sm font-normal text-gray-500">
            No data from last week
          </p>
        ) : (
          <div className="flex items-center gap-1 text-sm font-normal">
            {((thisWeek - previousTotal) / previousTotal) * 100 >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-600" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            )}
            <span
              className={
                ((thisWeek - previousTotal) / previousTotal) * 100 >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {(((thisWeek - previousTotal) / previousTotal) * 100).toFixed(1)}%
            </span>
            <span className="text-gray-500">
              from last week ({previousTotal})
            </span>
          </div>
        )}
      </Card>
      <DataTable columns={columns} data={orders} />
    </div>
  );
}
