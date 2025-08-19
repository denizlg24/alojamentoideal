"use client";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { IChatDocument } from "@/models/Chat";
import { format } from "date-fns";
import { CheckCircle } from "lucide-react";

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
      {sortedInboxes.map((inbox) => {
        return (
          <button
            onClick={() => {
              router.push(`?chat_id=${inbox.chat_id}`);
            }}
            className={cn(
              "border-b shadow w-full p-1 relative flex flex-col items-start text-left hover:bg-accent",
              selected == inbox.chat_id && "bg-accent"
            )}
            key={inbox.chat_id}
          >
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
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <div className="text-xs font-normal truncate w-full">
              {inbox.lastMessage}
            </div>
            <div className="text-xs text-muted-foreground font-normal">
              {format(inbox.lastMessageAt, "dd/MM - HH:MM:SS")}
            </div>
          </button>
        );
      })}
    </>
  );
};
