import { getInboxes } from "@/app/actions/getInboxes";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InboxesDisplay } from "./inboxes-display";
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
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin-inbox");

  const inboxes = await getInboxes();
  const sortedInboxes = [...inboxes].sort((a, b) => {
    const aUnread = (a.unread ?? 0) > 0;
    const bUnread = (b.unread ?? 0) > 0;

    if (aUnread !== bUnread) return Number(bUnread) - Number(aUnread);

    const dateA = new Date(a.lastMessageAt ?? 0).getTime();
    const dateB = new Date(b.lastMessageAt ?? 0).getTime();
    if (dateA !== dateB) return dateB - dateA;

    const unreadA = a.unread ?? 0;
    const unreadB = b.unread ?? 0;
    if (unreadA !== unreadB) return unreadB - unreadA;

    return String(a.chat_id ?? a.id ?? "").localeCompare(
      String(b.chat_id ?? b.id ?? "")
    );
  });

  return (
    <div className="w-full flex flex-col gap-4 items-start">
      <div className="grid lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 w-full">
        <div className="h-screen overflow-y-auto col-span-1 border-r shadow flex flex-col gap-1">
          <h1 className="text-lg font-bold border-y-2 w-full px-1">
            {t("inbox")}
          </h1>
          <InboxesDisplay sortedInboxes={sortedInboxes} selected={undefined} />
        </div>
      </div>
    </div>
  );
}
