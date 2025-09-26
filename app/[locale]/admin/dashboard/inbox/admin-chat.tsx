"use client";
import { Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { IMessage } from "@/models/Chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getChatMessages } from "@/app/actions/getChatMessages";
import { postMessage } from "@/app/actions/postMessage";
import { generateUniqueId } from "@/lib/utils";

export function AdminChat({
  chat_id,
  messages,
}: {
  chat_id: string;
  messages: IMessage[];
}) {
  const t = useTranslations("chat");
  const [message, setMessage] = useState("");
  const [currentMessages, setMessages] = useState<IMessage[]>(messages);

  const sorted = useMemo(
    () =>
      [...currentMessages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [currentMessages]
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const prevLength = useRef(0);
  const lastMessageTime = useRef<Date | null>(
    messages.length > 0 ? messages[messages.length - 1].createdAt : null
  );

  useEffect(() => {
    if (currentMessages.length > prevLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLength.current = currentMessages.length;
  }, [currentMessages]);

  useEffect(() => {
    const refreshInbox = async (chat_id: string) => {
      const newMessages = await getChatMessages(
        chat_id,
        true,
        lastMessageTime?.current || undefined
      );

      if (newMessages?.length > 0) {
        setMessages((prev) => {
          const map = new Map<string, IMessage>();
          [...prev, ...newMessages].forEach((msg) => {
            map.set(msg.message_id, msg);
          });
          return Array.from(map.values());
        });
        lastMessageTime.current = newMessages[newMessages.length - 1].createdAt;
      }
    };

    const interval = setInterval(() => {
      refreshInbox(chat_id);
      //sync automated Inbox
    }, 5000);

    return () => clearInterval(interval);
  }, [chat_id]);

  const sendMessage = async () => {
    setLoading(true);
    const optimisticMessageId = generateUniqueId();
    const optimisticMessage: IMessage = {
      sender: "admin",
      createdAt: new Date(),
      read: true,
      chat_id,
      message_id: optimisticMessageId,
      message,
    };
    setMessages((prev) => [
      ...prev.filter((m) => m.message_id !== optimisticMessageId),
      optimisticMessage,
    ]);
    setMessage("");
    setLoading(false);
    try {
      const savedMessage = await postMessage({
        message,
        chatId: chat_id,
        sender: "admin",
        optimisticMessageId,
      });
      if (savedMessage) {
        setMessages((prev) => [
          ...prev.filter((m) => m.message_id !== optimisticMessageId),
          savedMessage,
        ]);
        lastMessageTime.current = savedMessage.createdAt;
      }
    } catch {
    }
  };

  return (
    <div className="w-full mx-auto min-[525px]:h-[calc(100vh-152px)] h-[calc(100vh-260px)]  flex flex-col rounded-2xl overflow-hidden">
      <div className="flex-1 overflow-y-auto sm:p-4 p-2 space-y-4 bg-muted">
        {sorted.map((msg) => {
          const isMe = msg.sender == "admin";
          return (
            <div
              key={msg.message_id}
              className={`flex items-start gap-2 ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {!isMe && (
                <Avatar>
                  <AvatarImage
                    className="w-8 h-8 rounded-full object-cover"
                    src={""}
                  ></AvatarImage>
                  <AvatarFallback className="bg-background border font-semibold text-xs">
                    G
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-sm px-4 py-2 rounded-2xl text-sm shadow ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-background text-foreground rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-line break-all">{msg.message}</p>
                <span
                  className={`block text-xs mt-1 ${
                    isMe ? "text-muted/75" : "text-foreground/75"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              {isMe && (
                <Avatar>
                  <AvatarImage
                    className="w-8 h-8 rounded-full object-cover"
                    src={"/alojamento-ideal-logo.png"}
                  />
                  <AvatarFallback>{t("me")}</AvatarFallback>
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
          placeholder={t("message-placeholder")}
          className="w-full"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!loading && message.trim()) {
                sendMessage();
              }
            }
          }}
        />
        <Button disabled={loading} onClick={sendMessage}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> {t("sending")}
            </>
          ) : (
            <>
              {t("send")} <Send />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
