"use client";
import { Button } from "../ui/button";
import { Loader2, Send } from "lucide-react";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { IMessage } from "@/models/Chat";
import { getChatMessages } from "@/app/actions/getChatMessages";
import { postMessage } from "@/app/actions/postMessage";
import { generateUniqueId } from "@/lib/utils";

export function OrderChat({
  chat_id,
  refreshMessages,
}: {
  chat_id: string;
  refreshMessages: () => void;
}) {
  const t = useTranslations("chat");

  useEffect(() => {
    const interval = setInterval(() => {
      refreshMessages();
      //sync automated messages
    }, 60000 * 15);

    return () => clearInterval(interval);
  }, [refreshMessages]);

  const [message, setMessage] = useState("");
  const [currentMessages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const prevLength = useRef(0);

  const lastMessageTime = useRef<Date | null>(null);

  const sorted = useMemo(
    () =>
      [...currentMessages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [currentMessages]
  );

  useEffect(() => {
    if (currentMessages.length > prevLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLength.current = currentMessages.length;
  }, [currentMessages]);

  useEffect(() => {
    const fetchMessages = async (initial = false) => {
      try {
        if (initial) {
          setMessagesLoading(true);
        }
        const newMessages = await getChatMessages(
          chat_id,
          false,
          lastMessageTime?.current || undefined
        );

        if (newMessages.length > 0) {
          setMessages((prev) => [...prev, ...newMessages]);
          lastMessageTime.current =
            newMessages[newMessages.length - 1].createdAt;
        }
        if (initial) {
          setMessagesLoading(false);
        }
      } catch (error) {
        console.log(error);
        setMessagesLoading(false);
      }
    };

    fetchMessages(true);

    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [chat_id]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);

    const optimisticMessage: IMessage = {
      sender: "guest",
      createdAt: new Date(),
      read: false,
      chat_id,
      message_id: generateUniqueId(),
      message,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessage("");
    setLoading(false);

    try {
      const savedMessage = await postMessage({
        message,
        chatId: chat_id,
        sender: "guest",
      });
      if (savedMessage) {
        setMessages((prev) => [
          ...prev.filter((m) => m.message_id !== optimisticMessage.message_id),
          savedMessage,
        ]);
        lastMessageTime.current = savedMessage.createdAt;
      }
    } catch {
      console.log("Error");
    }
  };

  return (
    <div className="w-full mx-auto h-[80vh] flex flex-col rounded-2xl overflow-hidden">
      <div className="p-3 bg-primary text-primary-foreground font-semibold">
        {t("title")}
      </div>
      <div className="flex-1 overflow-y-auto sm:p-4 p-2 space-y-4 bg-muted relative text-muted-foreground">
        {sorted.map((msg) => {
          const isMe = msg.sender == "guest";
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
                    src={"/alojamento-ideal-logo.png"}
                  />
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow ${
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
        {messagesLoading && (
          <div className="w-full flex justify-start items-center gap-2 [&_svg]:text-muted-foreground! mt-4">
            <Loader2 className="animate-spin w-6! h-6! ![&_svg]:text-muted-foreground !text-muted-foreground" />
          </div>
        )}
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
