"use client";
import { Button } from "../ui/button";
import { Loader2, Send } from "lucide-react";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { hostifyRequest } from "@/utils/hostify-request";
import { useTranslations } from "next-intl";
type Message = {
  id: number;
  target_id: number;
  message: string;
  notes: string | null;
  created: string;
  image: string | null;
  guest_name: string;
  guest_thumb: string;
  is_sms: number;
  is_automatic: number;
  pinned: number;
  avatar: string | null;
  guest_id: number;
};

export function OrderChat({
  messages,
  guest_id,
  thread_id,
  refreshMessages,
  setThread,
}: {
  thread_id: string;
  messages: Message[];
  guest_id: string;
  refreshMessages: () => void;
  setThread: Dispatch<
    SetStateAction<
      | {
          success: boolean;
          thread: { id: string; channel_unread: number };
          messages: {
            id: number;
            target_id: number;
            message: string;
            notes: string | null;
            created: string;
            image: string | null;
            guest_name: string;
            guest_thumb: string;
            is_sms: number;
            is_automatic: number;
            pinned: number;
            avatar: string | null;
            guest_id: number;
          }[];
        }
      | undefined
    >
  >;
}) {
  const t = useTranslations("chat");
  const [message, setMessage] = useState("");
  const sorted = [...messages].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const prevLength = useRef(0);

  useEffect(() => {
    if (messages.length > prevLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLength.current = messages.length;
  }, [messages]);
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMessages();
    }, 15000);

    return () => clearInterval(interval);
  }, [refreshMessages]);

  return (
    <div className="w-full mx-auto h-[80vh] flex flex-col rounded-2xl overflow-hidden">
      <div className="p-3 bg-primary text-primary-foreground font-semibold">
        {t("title")}
      </div>

      <div className="flex-1 overflow-y-auto sm:p-4 p-2 space-y-4 bg-muted">
        {sorted.map((msg) => {
          const isMe =
            msg.guest_id.toString() === guest_id ||
            msg.message.startsWith("AL-WEBSITE:");
          const split = msg.message.startsWith("AL-WEBSITE:")
            ? msg.message.split("AL-WEBSITE:")[
                msg.message.split("AL-WEBSITE:").length - 1
              ]
            : msg.message;
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {!isMe && (
                <Avatar>
                  <AvatarImage
                    className="w-8 h-8 rounded-full object-cover"
                    src={msg.guest_thumb || msg.avatar || ""}
                  ></AvatarImage>
                  <AvatarFallback>
                    {msg.guest_name
                      .match(/(\b\S)?/g)!
                      .join("")
                      .match(/(^\S|\S$)?/g)!
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-background text-foreground rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-line break-all">{split}</p>
                <span
                  className={`block text-xs mt-1 ${
                    isMe ? "text-muted/75" : "text-foreground/75"
                  }`}
                >
                  {new Date(msg.created).toLocaleString()}
                </span>
              </div>
              {isMe && (
                <Avatar>
                  <AvatarImage
                    className="w-8 h-8 rounded-full object-cover"
                    src={""}
                  ></AvatarImage>
                  <AvatarFallback className="bg-background border font-semibold text-xs">
                    {t("me")}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-0 w-0" />
      </div>

      <div className="p-3 border-t bg-background flex gap-2">
        <Input
          onChange={(e) => {
            setMessage(e.target.value);
          }}
          value={message}
          type="text"
          placeholder="Type a message..."
          className="w-full"
        />
        <Button
          disabled={loading}
          onClick={async () => {
            setLoading(true);

            setThread((prev) => {
              if (!prev) {
                return prev;
              }
              return {
                ...prev,
                messages: [
                  ...prev.messages,
                  {
                    id: Math.random() * 1000,
                    target_id: Math.random() * 1000,
                    message: `AL-WEBSITE:${message}`,
                    notes: "",
                    created: new Date().toString(),
                    image: "",
                    guest_name: "ME",
                    guest_thumb: "",
                    is_sms: 0,
                    is_automatic: 0,
                    pinned: 0,
                    guest_id: parseInt(guest_id),
                    avatar: "",
                  },
                ],
              };
            });
            setMessage("");
            setLoading(false);
            await hostifyRequest<unknown>(`inbox/reply`, "POST", undefined, {
              thread_id,
              message: `AL-WEBSITE:${message}`,
              sent_by: "channel",
            });
            refreshMessages();
          }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Sending...
            </>
          ) : (
            <>
              Send <Send />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
