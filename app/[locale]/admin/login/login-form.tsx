"use client";

import { authenticate } from "@/app/actions/authenticate";
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

export const LoginForm = () => {
  const t = useTranslations("login-register");

  const loginFormSchema = z.object({
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
  });
  const [loading, setLoading] = useState(0);
  const [showPassword, toggleShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  async function onSubmit(values: z.infer<typeof loginFormSchema>) {
    setLoading(1);
    const response = await authenticate(values);
    if (response == true) {
      router.push("/admin/dashboard");
    } else {
      const error = response;
      if (error?.name == "CredentialsSignin") {
        const message = error?.message?.split(".")[0];
        if (!message) {
          form.setError("email", {
            type: "manual",
            message: "Unknown authentication error.",
          });
          setLoading(0);
        }
        switch (message) {
          case "email-password-missing":
            form.setError("email", {
              type: "manual",
              message: "Email or password is missing.",
            });
            break;
          case "no-account":
            form.setError("email", {
              type: "manual",
              message: "No account found with that email or username.",
            });
            break;
          case "wrong-password":
            form.setError("password", {
              type: "manual",
              message: "Incorrect password.",
            });
            break;
          case "not-verified":
            router.push("/admin/account-created");
            break;
        }
        setLoading(0);
      }
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
        <Button disabled={loading > 0} className="w-full" type="submit">
          {loading == 1 ? t("loginin-account") : t("login-account")}
          {loading == 1 && <Loader2 className="animate-spin" />}
        </Button>
      </form>
    </Form>
  );
};
