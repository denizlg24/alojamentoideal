"use client";

import { createAdminAccount } from "@/app/actions/createAdminAccount";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeClosed, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

export const RegisterForm = () => {
  const t = useTranslations("login-register");

  const registerFormSchema = z
    .object({
      email: z
        .string()
        .email(t("email-invalid-error"))
        .min(1, {
          message: t("email-empty-error"),
        }),
      password: z
        .string()
        .min(6, t("password-min-error"))
        .regex(/[A-Z]/, t("password-uppercase-error"))
        .regex(/[0-9]/, t("password-digit-error"))
        .regex(/[^a-zA-Z0-9]/, t("password-special-error")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("password-match-error"),
      path: ["confirmPassword"],
    });
  const [loading, setLoading] = useState(0);
  const [showPassword, toggleShowPassword] = useState(false);
  const [confirmShowPassword, toggleConfirmShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  async function onSubmit(values: z.infer<typeof registerFormSchema>) {
    setLoading(1);
    const { success, error } = await createAdminAccount({
      email: values.email,
      password: values.password,
    });
    if (success) {
      router.push(`/admin/account-created`);
      setLoading(0);
    } else {
      if (error) {
        if (error == "email-taken") {
          form.setError("email", {
            type: "manual",
            message: "That email is already in use.",
          });
        }
        if (error == "server-error") {
          form.setError("email", {
            type: "manual",
            message: "There was an unexpected problem creating your account.",
          });
        }
      }
      setLoading(0);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 w-full"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("email")}
                <span className="text-destructive text-xs">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder={t("email-placeholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>
                {t("password")}
                <span className="text-destructive text-xs">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("password-placeholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <Button
                type="button"
                onClick={() => {
                  toggleShowPassword((prev) => !prev);
                }}
                variant="link"
                className="absolute right-0 top-6"
              >
                {!showPassword ? <EyeClosed /> : <Eye />}
              </Button>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>
                {t("repeat-password")}
                <span className="text-destructive text-xs">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type={confirmShowPassword ? "text" : "password"}
                  placeholder={t("repeat-password-placeholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <Button
                type="button"
                onClick={() => {
                  toggleConfirmShowPassword((prev) => !prev);
                }}
                variant="link"
                className="absolute right-0 top-6"
              >
                {!confirmShowPassword ? <EyeClosed /> : <Eye />}
              </Button>
            </FormItem>
          )}
        />
        <Button disabled={loading > 0} className="w-full" type="submit">
          {loading == 1 ? t("creating-account") : t("create-account")}
          {loading == 1 && <Loader2 className="animate-spin" />}
        </Button>
      </form>
    </Form>
  );
};
