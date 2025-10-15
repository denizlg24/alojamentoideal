"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Minus, Plus, Send } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { getHtml } from "@/app/actions/getHtml";
import { sendMail } from "@/app/actions/sendMail";

export const OwnerContactCard = () => {
  const t = useTranslations("owner");
  const [stage, setStage] = useState(0);
  const [sending, setSending] = useState(false);
  const stage0FormSchema = z.object({
    address: z.string().min(2, {
      message: t("field-required"),
    }),
    location: z.string().min(2, {
      message: t("field-required"),
    }),
    number_of_properties: z.number(),
    number_of_bedrooms: z.number(),
  });
  const stage1FormSchema = z.object({
    name: z.string().min(2, {
      message: t("field-required"),
    }),
    email: z
      .string()
      .min(2, {
        message: t("field-required"),
      })
      .email(t("invalid-email")),
    phone_number: z.string().min(2, {
      message: t("field-required"),
    }),
  });

  const stage0Form = useForm<z.infer<typeof stage0FormSchema>>({
    resolver: zodResolver(stage0FormSchema),
    defaultValues: {
      address: "",
      location: "",
      number_of_properties: 1,
      number_of_bedrooms: 0,
    },
  });

  function onSubmitStage0(values: z.infer<typeof stage0FormSchema>) {
    console.log(values);
    setStage(1);
  }

  const stage1Form = useForm<z.infer<typeof stage1FormSchema>>({
    resolver: zodResolver(stage1FormSchema),
    defaultValues: {
      email: "",
      name: "",
      phone_number: "",
    },
  });

  async function onSubmitStage1(values: z.infer<typeof stage1FormSchema>) {
    setSending(true);
    const html = await getHtml("emails/new-contact-email.html", [
      { "{{full_name}}": values.name },
      { "{{date}}": new Date().toLocaleDateString() },
      { "{{email}}": values.email },
      { "{{subject}}": "Novo contacto de de proprietário." },
      {
        "{{message}}": `Telemóvel: ${values.phone_number}\n
Número de casas: ${stage0Form.getValues("number_of_properties")}\n
Número de quartos: ${stage0Form.getValues("number_of_bedrooms")}\n
Localização: ${stage0Form.getValues("location")}\n
Rua: ${stage0Form.getValues("address")}\n`,
      },
    ]);
    const { success } = await sendMail({
      email: "geral@alojamentoideal.pt",
      html,
      subject: "Novo contacto de de proprietário. - alojamentoideal.pt",
    });
    if (success) {
      setStage(2);
      setSending(false);
    } else {
      stage0Form.reset();
      stage1Form.reset();
      setStage(0);
      setSending(false);
    }
  }

  const locale = useLocale();

  return (
    <Card className="h-[500px] xl:w-[350px] w-full shadow-2xl p-0 overflow-hidden border-0 gap-3">
      <CardHeader className="bg-primary px-3 pt-4 pb-2">
        <div className="flex flex-row justify-between w-fit gap-2 items-center">
          <div
            className={cn(
              "w-4 h-4 rounded-full transition-colors",
              stage == 0 ? "bg-primary-foreground" : "bg-primary-foreground/50"
            )}
          ></div>
          <div
            className={cn(
              "w-4 h-4 rounded-full transition-colors",
              stage == 1 ? "bg-primary-foreground" : "bg-primary-foreground/50"
            )}
          ></div>
          <div
            className={cn(
              "w-4 h-4 rounded-full transition-colors",
              stage == 2 ? "bg-primary-foreground" : "bg-primary-foreground/50"
            )}
          ></div>
        </div>
        <h1 className="text-xl font-bold text-primary-foreground">
          {t("get-profitability-study-title")}
        </h1>
      </CardHeader>
      <CardContent className="h-full flex flex-col justify-stretch pb-4 px-4">
        {stage == 0 && (
          <Form {...stage0Form}>
            <form
              onSubmit={stage0Form.handleSubmit(onSubmitStage0)}
              className="h-full flex flex-col gap-2"
            >
              <FormField
                control={stage0Form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">{t("address")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={stage0Form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">{t("location")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div className="w-full flex flex-row items-start ">
                <div className="flex-1 flex flex-col gap-2 w-full">
                  <p className="text-xs font-semibold">
                    {t("number-properties")}
                  </p>
                  <FormField
                    name="number_of_properties"
                    render={({ field }) => (
                      <div className="flex flex-row w-full justify-between max-w-[100px]">
                        <Button
                          onClick={() => {
                            if (field.value == 1) {
                              field.onChange(1);
                            } else {
                              field.onChange(field.value - 1);
                            }
                          }}
                          variant={"outline"}
                          type={"button"}
                          className="shadow rounded-full w-6! h-6! p-1"
                        >
                          <Minus className="w-3! h-3!" />
                        </Button>
                        <p className="text-sm font-light">{field.value}</p>
                        <Button
                          variant={"outline"}
                          type={"button"}
                          onClick={() => {
                            field.onChange(field.value + 1);
                          }}
                          className="shadow rounded-full w-6! h-6!"
                        >
                          <Plus className="w-3! h-3!" />
                        </Button>
                      </div>
                    )}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2 w-full">
                  <p className="text-xs font-semibold">
                    {t("number-bedrooms")}
                  </p>
                  <FormField
                    name="number_of_bedrooms"
                    render={({ field }) => (
                      <div className="flex flex-row w-full justify-between max-w-[100px]">
                        <Button
                          variant={"outline"}
                          type={"button"}
                          onClick={() => {
                            if (field.value == 0) {
                              field.onChange(0);
                            } else {
                              field.onChange(field.value - 1);
                            }
                          }}
                          className="shadow rounded-full w-6! h-6! p-1"
                        >
                          <Minus className="w-3! h-3!" />
                        </Button>
                        <p className="text-sm font-light">{field.value}</p>
                        <Button
                          variant={"outline"}
                          type={"button"}
                          onClick={() => {
                            field.onChange(field.value + 1);
                          }}
                          className="shadow rounded-full w-6! h-6!"
                        >
                          <Plus className="w-3! h-3!" />
                        </Button>
                      </div>
                    )}
                  />
                </div>
              </div>
              <Button className="mt-auto w-full justify-self-end" type="submit">
                {t("next")} <ArrowRight />
              </Button>
            </form>
          </Form>
        )}
        {stage == 1 && (
          <Form {...stage1Form}>
            <form
              onSubmit={stage1Form.handleSubmit(onSubmitStage1)}
              className="h-full flex flex-col gap-2"
            >
              <FormField
                control={stage1Form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">{t("name")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={stage1Form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">{t("email")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={stage1Form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">
                      {t("phone-number")}
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        lang={locale}
                        defaultCountry="PT"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <Button
                disabled={sending}
                className="mt-auto w-full justify-self-end"
                type="submit"
              >
                {sending ? (
                  <>
                    {t("sending")} <Send />
                  </>
                ) : (
                  <>
                    {t("send")} <Send />
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}
        {stage == 2 && (
          <div className="w-full mx-auto max-w-[200px] flex flex-col items-center gap-4 text-center pt-6">
            <CheckCircle className="text-green-600 w-12 h-12" />
            <h1 className="font-bold text-lg">{t("email-success")}</h1>
            <h2 className="font-light text-sm text-muted-foreground">
              {t("will-be-in-contact")}
            </h2>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
