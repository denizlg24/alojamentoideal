import { getInboxes } from "@/app/actions/getInboxes";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { InboxesDisplay } from "./inboxes-display";
import { getChatMessages } from "@/app/actions/getChatMessages";
import { AdminChat } from "./admin-chat";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatInfo } from "./chat-info";

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
  searchParams,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
  searchParams: Promise<Record<string, string | undefined>>;
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

  const { chat_id } = await searchParams;

  if (chat_id) {
    const messages = await getChatMessages(chat_id, true);
    const chatIndx = sortedInboxes.findIndex((inbx) => inbx.chat_id == chat_id);
    sortedInboxes[chatIndx].unread = 0;
    return (
      <div className="w-full flex flex-col gap-4 items-start">
        <div className="lg:grid grid-cols-5 w-full h-full">
          <div className="col-span-1 border-r shadow lg:flex hidden flex-col gap-1">
            <h1 className="text-lg font-bold border-y-2 w-full px-1">
              {t("inbox")}
            </h1>
            <InboxesDisplay sortedInboxes={sortedInboxes} selected={chat_id} />
          </div>
          <div className="flex flex-col overflow-hidden w-full col-span-4">
            <div className="w-full p-4 border-2 shadow bg-primary">
              <Suspense
                fallback={
                  <Skeleton className="w-full min-[525px]:h-[116px] h-[224px]" />
                }
              >
                <ChatInfo
                  reservationId={sortedInboxes[chatIndx].reservation_id}
                  locale={locale}
                />
              </Suspense>
            </div>
            <div className="w-full">
              <AdminChat messages={messages} chat_id={chat_id} />
            </div>
          </div>
        </div>
      </div>
    );
  }

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
