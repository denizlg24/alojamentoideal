"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { sendMail } from "@/app/actions/sendMail";
import { toast } from "sonner";
import { getHtml } from "@/app/actions/getHtml";
import { cn } from "@/lib/utils";

export const ContactForm = () => {
  const t = useTranslations("contact");
  const t_toast = useTranslations("toast");
  const [sending, setSending] = useState(false);
  const formSchema = z.object({
    name: z.string().min(2, {
      message: t("name-error"),
    }),
    email: z.string().email({
      message: t("email-error"),
    }),
    subject: z.string().min(2, { message: t("subject-error") }),
    message: z
      .string()
      .min(16, { message: t("message-min-error") })
      .max(2048, { message: t("message-max-error") }),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSending(true);
    const html = await getHtml("public/emails/new-contact-email.html", [
      { "{{full_name}}": values.name },
      { "{{date}}": new Date().toLocaleDateString() },
      { "{{email}}": values.email },
      { "{{subject}}": values.subject },
      { "{{message}}": values.message },
    ]);
    const { success } = await sendMail({
      email: "site@alojamentoideal.pt",
      html,
      subject: "Novo contacto - alojamentoideal.pt",
    });

    const copyHtml = await getHtml(
      "public/emails/new-contact-copy-email.html",
      [
        { "{{title}}": t("we-got-your-message-title", { name: values.name }) },
        { "{{intro}}": t("intro", { name: values.name }) },
        { "{{subject-title}}": t("subject") },
        { "{{subject}}": values.subject },
        { "{{we-got-your-message-desc}}": t("we-got-your-message-desc") },
      ]
    );

    await sendMail({
      email: values.email,
      html: copyHtml,
      subject: "Alojamento Ideal - Support",
    });

    if (success) {
      toast.success(t_toast("email-sent"));
    } else {
      toast.error(t_toast("email-fail"));
    }
    form.reset();
    setSending(false);
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("your-name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("name-placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("your-email")}</FormLabel>
              <FormControl>
                <Input placeholder={t("email-placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("subject")}</FormLabel>
              <FormControl>
                <Input placeholder={t("subject-placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("your-message")}</FormLabel>
              <FormControl>
                <Textarea
                  className="resize-none h-[200px]"
                  placeholder={t("message-placeholder")}
                  {...field}
                />
              </FormControl>
              <FormDescription
                className={cn(field.value.length > 2048 && "text-destructive")}
              >
                {field.value.length}/2048 {t("chars-left")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit">
          {sending ? (
            <>
              <Loader2 className="animate-spin" /> {t("sending")}
            </>
          ) : (
            <>{t("get-in-touch")}</>
          )}
        </Button>
      </form>
    </Form>
  );
};
