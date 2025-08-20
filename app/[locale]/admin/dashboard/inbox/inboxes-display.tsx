"use client";

import { closeChat } from "@/app/actions/closeChat";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { IChatDocument } from "@/models/Chat";
import { format } from "date-fns";
import { CheckCheck } from "lucide-react";

export const InboxesDisplay = ({
  sortedInboxes,
  selected,
}: {
  sortedInboxes: IChatDocument[];
  selected: string | undefined;
}) => {
  const router = useRouter();
  return (
    <>
      {sortedInboxes
        .filter((inbox) => inbox.automation_done)
        .map((inbox) => {
          return (
            <button
              onClick={() => {
                router.push(`/admin/dashboard/inbox/${inbox.chat_id}`);
              }}
              className={cn(
                "border-b shadow w-full p-1 flex flex-col items-start text-left hover:bg-accent relative group",
                selected == inbox.chat_id && "bg-accent"
              )}
              key={inbox.chat_id}
            >
              <div className="group-hover:flex hidden items-start justify-end p-1 z-10 w-full h-full absolute">
                <p
                  onClick={async (e) => {
                    e.stopPropagation();
                    await closeChat(inbox.chat_id);
                    router.push(`/admin/dashboard/inbox`);
                  }}
                  className="rounded hover:cursor-pointer text-sm px-2 h-6 bg-destructive text-white font-bold items-center justify-center text-center flex"
                >
                  Close
                </p>
              </div>
              <div className="w-full flex flex-row gap-2 items-center justify-between">
                <p className="truncate w-full text-sm font-medium">
                  {inbox.guest_name}
                </p>
                {inbox.unread > 0 && (
                  <p className="bg-amber-600 text-sm p-0.5 rounded-full h-full aspect-square w-auto shadow-lg border text-white items-center justify-center flex">
                    {inbox.unread}
                  </p>
                )}
                {inbox.unread == 0 && (
                  <div className="bg-green-800 rounded-full p-0.5 text-white w-5 h-5 flex items-center justify-center">
                    <CheckCheck className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <div className="text-xs font-normal truncate w-full">
                {inbox.lastMessage}
              </div>
              <div className="w-full flex flex-row items-center justify-between">
                <div className="text-xs text-muted-foreground font-normal">
                  {inbox.lastMessageAt &&
                    format(inbox.lastMessageAt, "dd/MM - HH:MM:SS")}
                </div>
                <div className="text-xs text-muted-foreground font-normal">
                  {inbox.booking_reference}
                </div>
              </div>
            </button>
          );
        })}
    </>
  );
};
