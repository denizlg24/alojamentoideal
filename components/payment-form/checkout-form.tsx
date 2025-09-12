/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { calculateAmount } from "@/app/actions/calculateAmount";
import { useCart } from "@/hooks/cart-context";
import { useRouter } from "@/i18n/navigation";
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  AddressElement,
  IbanElement,
} from "@stripe/react-stripe-js";
import flags from "react-phone-number-input/flags";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
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
} from "../ui/form";
import { useTranslations } from "next-intl";
import { buyCart } from "@/app/actions/completeCheckout";
import {
  Loader2,
  ArrowRight,
  Edit3,
  CalendarIcon,
  Plus,
  Edit2,
} from "lucide-react";
import { Appearance, PaymentRequest } from "@stripe/stripe-js";
import { Separator } from "../ui/separator";
import { checkVAT, countries } from "jsvat";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Country } from "react-phone-number-input";
import { FaApplePay } from "react-icons/fa6";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

import cardSvg from "@/public/stripe-card.svg";
import sepaSvg from "@/public/stripe-sepa.svg";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { CountrySelect } from "../orders/country-select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  isPaxBookingQuestion,
  isPaxInfoQuestion,
} from "@/app/[locale]/(frontend)/checkout/activity/[id]/checkout-form";
import { PhoneInput } from "../ui/phone-input";
import {
  ContactInformationDto,
  ExperienceBookingQuestionDto,
  PickupPlaceDto,
} from "@/utils/bokun-requests";
import { Skeleton } from "../ui/skeleton";

const elementStyle: Appearance = {
  variables: {
    fontFamily:
      '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSizeXl: "14px",
    fontSizeLg: "14px",
    fontSizeBase: "14px",
    fontSizeSm: "14px",
    fontSizeXs: "14px",
    fontSize2Xs: "14px",
    fontSize3Xs: "14px",
    colorTextPlaceholder: "#9ca3af",
    colorDanger: "#ef4444",
    colorPrimary: "#5a002c",
  },
};

const FlagComponent = ({
  country,
  countryName,
}: {
  country: Country;
  countryName: string;
}) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-xs bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export const CheckoutForm = ({
  activities,
}: {
  activities: {
    meeting:
      | {
          type: "PICK_UP";
          pickUpPlaces: PickupPlaceDto[];
        }
      | {
          type: "MEET_ON_LOCATION";
        }
      | {
          type: "MEET_ON_LOCATION_OR_PICK_UP";
          pickUpPlaces: PickupPlaceDto[];
        };
    bookingQuestions: ExperienceBookingQuestionDto[];
    rateId: number;
    experienceId: number;
    mainPaxInfo: ContactInformationDto[];
    otherPaxInfo?: ContactInformationDto[];
    selectedDate: Date;
    selectedStartTimeId: number | undefined;
    guests: { [categoryId: number]: number };
  }[];
}) => {
  const t = useTranslations("checkout_form");
  const PaxInfoErrorComponent = ({
    value,
    validator,
    required,
  }: {
    value: any | undefined;
    validator: (arg0: any) => string | false;
    required: boolean;
  }) => {
    if (!required) {
      return <></>;
    }
    if (!value) {
      return (
        <p className="text-xs w-full text-destructive font-medium">
          {t("required")}
        </p>
      );
    }
    const validation = validator(value);
    if (validation)
      return (
        <p className="text-xs w-full text-destructive font-medium">
          {t(validation)}
        </p>
      );
  };
  const stripe = useStripe();
  const elements = useElements();
  elements?.update({ appearance: elementStyle });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { cart, cartLoading } = useCart();
  const [_amount, setAmount] = useState(0);
  const [priceLoading, setPriceLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [addressData, setAddressData] = useState<{
    name: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    address: {
      line1: string;
      line2: string | null;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
    phone?: string | undefined;
  }>();

  const [needCompanySwitch, setNeedCompanySwitch] = useState(false);
  const [vatCountryCode, setVatCountryCode] = useState("PT");
  const [selectedTab, selectTab] = useState("card");
  const [step, setStep] = useState<"client_info" | number | "paying">(
    "client_info"
  );

  const router = useRouter();
  useEffect(() => {
    const getAmount = async () => {
      setPriceLoading(true);
      const amount = await calculateAmount(cart);
      setAmount(amount);
      setPriceLoading(false);
    };
    if (cart.length == 0 && !cartLoading) {
      if (document.referrer && document.referrer !== window.location.href) {
        router.back();
      } else {
        router.push("/");
      }
    } else if (!cartLoading) {
      setChecking(false);
      getAmount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);
  const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
    setLoading(true);
    setLoadingMessage("loading_verify_price");
    setError("");
    if (!addressData) {
      setLoading(false);
      setError("provide_information");
      return;
    }
    const clientName =
      addressData.name ?? addressData.firstName + " " + addressData.lastName;
    const clientBusiness = data.business_name;
    const clientEmail = data.email;
    const clientPhone = addressData?.phone ?? "";
    const clientNotes = data.note;
    const clientTax = data.vat;
    const clientAddress = addressData.address;
    setLoadingMessage("loading_create_res");
    const { success, client_secret, payment_id, order_id } = await buyCart({
      cart,
      clientName,
      clientEmail,
      clientPhone,
      clientNotes,
      clientAddress,
      clientTax,
      isCompany: needCompanySwitch,
      companyName: clientBusiness,
    });
    if (!success || !client_secret || !payment_id) {
      setError("error_reservation");
      setLoading(false);
      return;
    }
    setLoadingMessage("loading_process_pay");
    if (selectedTab == "card") {
      const cardNumberElement = elements?.getElement(CardNumberElement);
      if (!stripe || !cardNumberElement) throw new Error("Stripe not ready");
      setLoadingMessage("loading_verify_pay");
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: clientName,
            email: clientEmail,
            phone: clientPhone,
            address: addressData.address,
          },
        },
      });
      if (result.error) {
        setError(result.error.message || "Payment failed");
        setLoading(false);
        return;
      }
      if (success && order_id) {
        localStorage.clear();
        router.push(`/orders/${order_id}`);
      } else {
        setLoading(false);
      }
    } else {
      const ibanNumberElement = elements?.getElement(IbanElement);
      if (!stripe || !ibanNumberElement) throw new Error("Stripe not ready");
      setLoadingMessage("loading_verify_pay");
      const result = await stripe.confirmSepaDebitPayment(client_secret, {
        payment_method: {
          sepa_debit: ibanNumberElement,
          billing_details: {
            name: clientName,
            email: clientEmail,
            phone: clientPhone,
            address: addressData.address,
          },
        },
      });
      if (result.error) {
        setError(result.error.message || "Payment failed");
        setLoading(false);
        return;
      }
      if (success && order_id) {
        localStorage.clear();
        router.push(`/orders/${order_id}`);
      } else {
        setLoading(false);
      }
    }
  };

  const FormSchema = z.object({
    note: z.string().min(0),
    email: z.string().email({
      message: t("error_email"),
    }),
    business_name: z.string().refine(
      (val) => {
        if (needCompanySwitch) {
          if (!val.trim()) {
            return false;
          }
        }
        return true;
      },
      { message: t("invalid-company") }
    ),
    vat: z
      .string()
      .refine(
        (val) => {
          if (needCompanySwitch) {
            return checkVAT(val, countries).isValid;
          }
          const rest = val.slice(2);
          if (!rest) return true;
          return checkVAT(val, countries).isValid;
        },
        {
          message: t("invalid-tax"),
        }
      )
      .optional(),
  });

  const clientInfo = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      note: "",
      email: "",
      vat: "",
      business_name: "",
    },
  });

  //activities
  const [addOtherPaxDialogOpen, setAddOtherPaxDialogOpen] = useState(false);
  const [addOtherPaxBirthdayOpen, setAddOtherPaxBirthdayOpen] = useState(false);
  const [addOtherPaxDialogIndex, setAddOtherPaxDialogIndx] = useState<
    number | undefined
  >(undefined);
  const [bookingAnswers, setBookingAnswers] = useState(
    activities.map((activity) => {
      return activity.bookingQuestions
        .filter((question) => question.context == "BOOKING")
        .map((question) => {
          return {
            ...question,
            value: "",
          };
        });
    })
  );

  const [mainPaxAnswers, setMainPaxAnswers] = useState(
    activities.map((activity) => [
      ...activity.bookingQuestions
        .filter((question) => question.context == "PASSENGER")
        .map((question) => {
          return {
            ...question,
            value: "",
            id: question.id.toString(),
            touched: true,
          };
        }),
      ...activity.mainPaxInfo
        .map((mainPaxInfoQuestion, indx) => {
          if (
            [
              "FIRST_NAME",
              "LAST_NAME",
              "PHONE_NUMBER",
              "EMAIL",
              "ADDRESS",
            ].includes(mainPaxInfoQuestion.type)
          ) {
            return undefined;
          } else {
            return {
              ...mainPaxInfoQuestion,
              value: "",
              id: `main-pax-info-${indx}`,
              touched: true,
            };
          }
        })
        .filter((info) => info != undefined),
    ])
  );

  const [otherPaxAnswers, setOtherPaxAnswers] = useState(
    activities.map((activity) =>
      Array.from(
        {
          length:
            Object.values(activity.guests).reduce(
              (acc, curr) => acc + curr,
              0
            ) - 1,
        },
        (_v, k) => {
          return [
            ...activity.bookingQuestions
              .filter((question) => question.context == "PASSENGER")
              .map((question) => {
                return {
                  ...question,
                  value: "",
                  id: question.id.toString(),
                  touched: false,
                };
              }),
            ...(activity.otherPaxInfo?.map((mainPaxInfoQuestion, indx) => {
              return {
                ...mainPaxInfoQuestion,
                value: "",
                id: `other-pax-${k}-${indx}`,
                touched: false,
              };
            }) ?? []),
          ];
        }
      )
    )
  );

  const [otherPaxCurrentAnswers, setOtherPaxCurrentAnswers] = useState<
    Record<string, string>
  >({});

  const [questionsError, setQuestionsError] = useState("");

  const handleBookingAnswerChange = useCallback(
    (indx: number, id: number, value: string) => {
      setBookingAnswers((prev) =>
        prev.map((activity, i) =>
          i == indx
            ? activity.map((q) => (q.id === id ? { ...q, value } : q))
            : activity
        )
      );
      setQuestionsError("");
    },
    [setBookingAnswers]
  );

  const handleMainPaxChange = useCallback(
    (indx: number, id: string, value: string) => {
      setMainPaxAnswers((prev) =>
        prev.map((activity, i) =>
          i == indx
            ? activity.map((answer) =>
                answer.id === id ? { ...answer, value } : answer
              )
            : activity
        )
      );
      setQuestionsError("");
    },
    []
  );

  const handleOtherPaxBulkChange = useCallback(
    (baseIndx: number, indx: number, values: Record<string, string>) => {
      setOtherPaxAnswers((prev) =>
        prev.map((activity, i) =>
          i == baseIndx
            ? activity.map((paxAnswers, paxIndex) => {
                if (paxIndex !== indx) return paxAnswers;
                return paxAnswers.map((answer) =>
                  values.hasOwnProperty(answer.id)
                    ? { ...answer, value: values[answer.id], touched: true }
                    : { ...answer, touched: true }
                );
              })
            : activity
        )
      );
      setQuestionsError("");
    },
    []
  );

    const handleSubmitAnswers = async (indx:number) => {
    const bookingAnswersIncomplete = bookingAnswers[indx].some(
      (answer) =>
        answer.value == "" &&
        (answer.required == true || answer.requiredBeforeDeparture == true)
    );
    const mainPaxAnswersIncomplete = mainPaxAnswers[indx].some(
      (answer) =>
        answer.value == "" &&
        (answer.required == true || answer.requiredBeforeDeparture == true)
    );
    const otherPaxAnswersIncomplete = otherPaxAnswers[indx].some((pax) =>
      pax.some(
        (answer) =>
          answer.value == "" &&
          (answer.required == true || answer.requiredBeforeDeparture == true)
      )
    );
    if (
      mainPaxAnswersIncomplete ||
      otherPaxAnswersIncomplete ||
      bookingAnswersIncomplete
    ) {
      setQuestionsError(t("questions-incomplete-error"));
      return;
    }
    setAddOtherPaxDialogIndx(undefined);
    setAddOtherPaxDialogOpen(false);
    setOtherPaxCurrentAnswers({});
    setStep(indx == activities.length-1 ? "paying" : indx+1);
  };
  //

  useEffect(() => {
    if (!loading) return;

    function beforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [loading]);

  const [paymentRequest, setPaymentRequest] = useState<
    PaymentRequest | undefined
  >(undefined);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: "PT",
      currency: "eur",
      total: {
        label: "Alojamento Ideal",
        amount: _amount, // in cents
      },
      displayItems: [
        ...cart
          .filter((item) => item.type == "accommodation")
          .map((item) => {
            return {
              label: item.name,
              amount: item.front_end_price * 100,
            };
          }),
      ],
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        const applePay = result["applePay"];
        if (applePay) {
          setPaymentRequest(pr);
        }
      }
    });

    pr.on("paymentmethod", async (event) => {
      try {
        if (!addressData) {
          setLoading(false);
          setError("provide_information");
          return;
        }
        const clientName =
          addressData.name ??
          addressData.firstName + " " + addressData.lastName;
        const clientBusiness = clientInfo.getValues("business_name");
        const clientEmail = clientInfo.getValues("email");
        const clientPhone = addressData?.phone ?? "";
        const clientNotes = clientInfo.getValues("note");
        const clientTax = clientInfo.getValues("vat");
        const clientAddress = addressData.address;
        setLoadingMessage("loading_create_res");
        const { success, client_secret, payment_id, order_id } = await buyCart({
          cart,
          clientName,
          clientEmail,
          clientPhone,
          clientNotes,
          clientAddress,
          clientTax,
          isCompany: needCompanySwitch,
          companyName: clientBusiness,
        });
        if (!success || !client_secret || !payment_id || !order_id) {
          event.complete("fail");
          setError("error_reservation");
          setLoading(false);
          return;
        }
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          client_secret,
          {
            payment_method: event.paymentMethod.id,
          },
          { handleActions: false }
        );

        if (error) {
          event.complete("fail");
          return;
        }

        event.complete("success");

        if (paymentIntent.status === "requires_action") {
          const { error: actionError } = await stripe.confirmCardPayment(
            client_secret
          );
          if (actionError) {
            setError(actionError.message || "Payment failed");
            setLoading(false);
            return;
          }
        }

        router.push(`/orders/${order_id}`);
      } catch (err) {
        console.error(err);
        event.complete("fail");
        setError("Payment failed");
        setLoading(false);
      }
    });
  }, [
    stripe,
    _amount,
    addressData,
    clientInfo,
    router,
    needCompanySwitch,
    cart,
  ]);

  if (checking) return <Skeleton className="w-full h-full min-h-[250px]"/>;

  return (
    <Card className="p-4">
      <Form {...clientInfo}>
        <form
          onSubmit={clientInfo.handleSubmit(handleSubmit)}
          className="w-full flex flex-col gap-2"
        >
          {step == "client_info" && (
            <>
              <FormField
                control={clientInfo.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full flex flex-col gap-1">
                    <FormLabel className="text-sm font-normal">
                      {t("email")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="rounded shadow-xs p-[10.5px] h-fit! border! text-sm!"
                        placeholder={t("email_placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-row gap-1">
                <Checkbox
                  className="translate-y-[2px] shadow-xs"
                  defaultChecked={false}
                  checked={needCompanySwitch}
                  onCheckedChange={(checked) => {
                    setNeedCompanySwitch(
                      checked.valueOf() === true ? true : false
                    );
                  }}
                />
                <p className="text-sm">{t("purchasing-as-company")}</p>
              </div>
              {needCompanySwitch && (
                <>
                  <FormField
                    control={clientInfo.control}
                    name="business_name"
                    render={({ field }) => (
                      <FormItem className="w-full flex flex-col gap-1">
                        <FormLabel className="text-sm font-normal">
                          {t("business_name")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="rounded shadow-xs p-[10.5px] h-fit! border! text-sm!"
                            placeholder={t("business_placeholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <AddressElement
                    onChange={(e) => {
                      setError("");
                      if (!e.complete) {
                        return;
                      }
                      setAddressData(e.value);
                    }}
                    options={{
                      mode: "billing",
                      autocomplete: { mode: "automatic" },
                      display: { name: "split" },
                      fields: { phone: "always" },
                      validation: { phone: { required: "always" } },
                    }}
                  />
                </>
              )}
              {!needCompanySwitch && (
                <AddressElement
                  onChange={(e) => {
                    setError("");
                    if (!e.complete) {
                      return;
                    }
                    setAddressData(e.value);
                  }}
                  options={{
                    mode: "billing",
                    autocomplete: { mode: "automatic" },
                    display: { name: "split" },
                    fields: { phone: "always" },
                    validation: { phone: { required: "always" } },
                  }}
                />
              )}
              <FormField
                control={clientInfo.control}
                name="vat"
                render={({ field }) => {
                  const valueWithoutPrefix =
                    field.value?.replace(
                      new RegExp(`^${vatCountryCode}`),
                      ""
                    ) ?? "";
                  return (
                    <FormItem className="w-full flex flex-col gap-1">
                      <FormLabel className="text-sm font-normal">
                        {t("vat")} {!needCompanySwitch && t("vat-optional")}
                      </FormLabel>
                      <FormControl>
                        <div className="flex flex-row items-center gap-2 w-full">
                          <Select
                            onValueChange={(value) => {
                              setVatCountryCode(value);
                              const rest =
                                field.value?.replace(/^[A-Z]{2}/, "") ?? "";
                              field.onChange(value + rest);
                            }}
                            value={vatCountryCode}
                            defaultValue="PT"
                          >
                            <SelectTrigger className="rounded shadow-xs p-[10.5px] h-fit! border! text-sm! col-span-1">
                              <SelectValue placeholder="Choose your country" />
                            </SelectTrigger>
                            <SelectContent className="w-fit!">
                              <SelectGroup>
                                {countries.map((country) => {
                                  return (
                                    <SelectItem
                                      key={country.codes[0]}
                                      value={country.codes[0]}
                                    >
                                      <FlagComponent
                                        country={country.codes[0] as Country}
                                        countryName={country.name}
                                      />
                                      {country.name}
                                    </SelectItem>
                                  );
                                })}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <Input
                            {...field}
                            value={valueWithoutPrefix}
                            onChange={(e) => {
                              const newValue = e.target.value.replace(
                                new RegExp(`^${vatCountryCode}`),
                                ""
                              );
                              field.onChange(vatCountryCode + newValue);
                            }}
                            className="rounded shadow-xs p-[10.5px] h-fit! border! text-sm! col-span-3"
                            placeholder={"123456789"}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={clientInfo.control}
                name="note"
                render={({ field }) => (
                  <FormItem className="w-full flex flex-col gap-0">
                    <FormLabel className="text-sm font-normal">
                      {t("notes")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="border shadow-xs rounded resize-none p-3! focus:outline-0! focus:ring-0! text-sm! h-24"
                        placeholder={t("notes_placeholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                onClick={async () => {
                  const result = await clientInfo.trigger();
                  if (!result) {
                    if (!addressData) {
                      setError("provide_information");
                      return;
                    }
                    return;
                  }
                  if (!addressData) {
                    setError("provide_information");
                    return;
                  }
                  if (activities.length > 0) {
                    setStep(0);
                  } else {
                    setStep("paying");
                  }
                }}
              >
                {activities.length > 0 ? t("continue") : t("proceed-payment")}{" "}
                <ArrowRight />
              </Button>
            </>
          )}

          {typeof step === "number" && (
            <div className="w-full flex flex-col gap-4 items-start">
              {bookingAnswers[step].length > 0 && (
                <p className="sm:text-base text-sm pb-1 border-b-2 w-full max-w-[230px] border-b-primary font-semibold">
                  {t("booking-questions")}
                </p>
              )}
              <div className="w-full flex flex-col gap-2 items-start">
                {bookingAnswers[step].map((bookingQuestion) => {
                  return (
                    <div
                      key={bookingQuestion.id}
                      className="flex flex-col gap-1 w-full items-start"
                    >
                      <FormLabel>
                        {bookingQuestion.label}
                        {bookingQuestion.required && (
                          <span className="text-xs font-semibold text-destructive">
                            *
                          </span>
                        )}
                      </FormLabel>
                      {(() => {
                        switch (bookingQuestion.dataType) {
                          case "SHORT_TEXT":
                            return (
                              <Input
                                value={bookingQuestion.value}
                                onChange={(e) => {
                                  handleBookingAnswerChange(
                                    step,
                                    bookingQuestion.id,
                                    e.target.value
                                  );
                                }}
                                placeholder={bookingQuestion.placeholder ?? ""}
                                className="w-full"
                              />
                            );
                          case "LONG_TEXT":
                            return (
                              <Textarea
                                value={bookingQuestion.value}
                                onChange={(e) => {
                                  handleBookingAnswerChange(
                                    step,
                                    bookingQuestion.id,
                                    e.target.value
                                  );
                                }}
                                placeholder={bookingQuestion.placeholder ?? ""}
                                className="w-full resize-none h-16"
                              />
                            );
                          case "INT":
                            return (
                              <Input
                                value={bookingQuestion.value}
                                onChange={(e) => {
                                  handleBookingAnswerChange(
                                    step,
                                    bookingQuestion.id,
                                    e.target.value
                                  );
                                }}
                                placeholder={bookingQuestion.placeholder ?? ""}
                                type="number"
                                step={1}
                                className="w-full"
                              />
                            );
                          case "DOUBLE":
                            return (
                              <Input
                                value={bookingQuestion.value}
                                onChange={(e) => {
                                  handleBookingAnswerChange(
                                    step,
                                    bookingQuestion.id,
                                    e.target.value
                                  );
                                }}
                                placeholder={bookingQuestion.placeholder ?? ""}
                                type="number"
                                step="any"
                                className="w-full"
                              />
                            );
                          case "BOOLEAN":
                            return <></>;
                          case "CHECKBOX_TOGGLE":
                            return <></>;
                          case "DATE":
                            return <></>;
                          case "DATE_AND_TIME":
                            return <></>;
                          case "OPTIONS":
                            return <></>;
                        }
                      })()}
                    </div>
                  );
                })}
              </div>
              {mainPaxAnswers[step].length > 0 && (
                <>
                  <p className="sm:text-base text-sm pb-1 border-b-2 w-full max-w-[230px] border-b-primary font-semibold">
                    {t("main-pax-title")}
                  </p>
                  <div className="w-full flex flex-col gap-2 items-start">
                    {mainPaxAnswers[step].length > 0 && (
                      <>
                        {mainPaxAnswers[step].map((bookingQuestion) => {
                          if (isPaxBookingQuestion(bookingQuestion)) {
                            return (
                              <div
                                key={bookingQuestion.id}
                                className="flex flex-col gap-1 w-full items-start"
                              >
                                <FormLabel>
                                  {bookingQuestion.label}
                                  {bookingQuestion.required && (
                                    <span className="text-xs font-semibold text-destructive">
                                      *
                                    </span>
                                  )}
                                </FormLabel>
                                {(() => {
                                  switch (bookingQuestion.dataType) {
                                    case "SHORT_TEXT":
                                      return (
                                        <Input
                                          value={bookingQuestion.value}
                                          onChange={(e) =>
                                            handleMainPaxChange(
                                              step,
                                              bookingQuestion.id,
                                              e.target.value
                                            )
                                          }
                                          placeholder={
                                            bookingQuestion.placeholder ?? ""
                                          }
                                          className="w-full"
                                        />
                                      );
                                    case "LONG_TEXT":
                                      return (
                                        <Textarea
                                          value={bookingQuestion.value}
                                          onChange={(e) =>
                                            handleMainPaxChange(
                                              step,
                                              bookingQuestion.id,
                                              e.target.value
                                            )
                                          }
                                          placeholder={
                                            bookingQuestion.placeholder ?? ""
                                          }
                                          className="w-full resize-none h-16"
                                        />
                                      );
                                    case "INT":
                                      return (
                                        <Input
                                          value={bookingQuestion.value}
                                          onChange={(e) =>
                                            handleMainPaxChange(
                                              step,
                                              bookingQuestion.id,
                                              e.target.value
                                            )
                                          }
                                          placeholder={
                                            bookingQuestion.placeholder ?? ""
                                          }
                                          type="number"
                                          step={1}
                                          className="w-full"
                                        />
                                      );
                                    case "DOUBLE":
                                      return (
                                        <Input
                                          value={bookingQuestion.value}
                                          onChange={(e) =>
                                            handleMainPaxChange(
                                              step,
                                              bookingQuestion.id,
                                              e.target.value
                                            )
                                          }
                                          placeholder={
                                            bookingQuestion.placeholder ?? ""
                                          }
                                          type="number"
                                          step="any"
                                          className="w-full"
                                        />
                                      );
                                    case "BOOLEAN":
                                      return <>BOOLEAN</>;
                                    case "CHECKBOX_TOGGLE":
                                      return <>CHECKBOX</>;
                                    case "DATE":
                                      return <>DATE</>;
                                    case "DATE_AND_TIME":
                                      return <>DATE_AND_TIME</>;
                                    case "OPTIONS":
                                      return <>OPTIONS</>;
                                  }
                                })()}
                              </div>
                            );
                          }
                          if (isPaxInfoQuestion(bookingQuestion)) {
                            switch (bookingQuestion.type) {
                              case "TITLE":
                                return (
                                  <div
                                    key={bookingQuestion.type}
                                    className="w-full flex flex-col gap-2 items-start"
                                  >
                                    <FormLabel>{t("title")}</FormLabel>
                                    <Select
                                      onValueChange={(v) => {
                                        handleMainPaxChange(
                                          step,
                                          bookingQuestion.id,
                                          v
                                        );
                                      }}
                                      value={bookingQuestion.value}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue
                                          placeholder={t("choose-one")}
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="sr">
                                          {t("sr")}
                                        </SelectItem>
                                        <SelectItem value="mrs">
                                          {t("msr")}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <PaxInfoErrorComponent
                                      value={bookingQuestion.value}
                                      required={bookingQuestion.required}
                                      validator={(arg0: any) => {
                                        if (
                                          (arg0.toString() as string).length > 0
                                        ) {
                                          return false;
                                        }
                                        return "invalid-language";
                                      }}
                                    />
                                  </div>
                                );
                              case "PERSONAL_ID_NUMBER":
                                return (
                                  <div
                                    key={bookingQuestion.type}
                                    className="w-full flex flex-col gap-2 items-start"
                                  >
                                    <FormLabel>
                                      {t("cc-number-title")}
                                    </FormLabel>
                                    <Input
                                      value={bookingQuestion.value}
                                      onChange={(e) => {
                                        handleMainPaxChange(
                                          step,
                                          bookingQuestion.id,
                                          e.target.value
                                        );
                                      }}
                                      type="text"
                                      className="w-full"
                                    />
                                    <PaxInfoErrorComponent
                                      value={bookingQuestion.value}
                                      required={bookingQuestion.required}
                                      validator={(arg0: any) => {
                                        const regex = /^[A-Z0-9]{6,15}$/i;
                                        if (
                                          regex.test(
                                            (arg0.toString() as string).trim()
                                          )
                                        ) {
                                          return false;
                                        }
                                        return "invalid-cc";
                                      }}
                                    />
                                  </div>
                                );
                              case "NATIONALITY":
                                return (
                                  <div
                                    key={bookingQuestion.type}
                                    className="w-full flex flex-col gap-2 items-start"
                                  >
                                    <FormLabel>{t("nationality")}</FormLabel>
                                    <CountrySelect
                                      placeholder={t("choose-nationality")}
                                      value={bookingQuestion.value}
                                      onChange={(e) => {
                                        handleMainPaxChange(
                                          step,
                                          bookingQuestion.id,
                                          e
                                        );
                                      }}
                                      className="w-full"
                                    />
                                    <PaxInfoErrorComponent
                                      value={bookingQuestion.value}
                                      required={bookingQuestion.required}
                                      validator={(arg0: any) => {
                                        if (
                                          (arg0.toString() as string).length > 0
                                        ) {
                                          return false;
                                        }
                                        return "invalid-country";
                                      }}
                                    />
                                  </div>
                                );
                              case "GENDER":
                                return (
                                  <div
                                    key={bookingQuestion.type}
                                    className="w-full flex flex-col gap-2 items-start"
                                  >
                                    <FormLabel>{t("gender")}</FormLabel>
                                    <Select
                                      onValueChange={(v) => {
                                        handleMainPaxChange(
                                          step,
                                          bookingQuestion.id,
                                          v
                                        );
                                      }}
                                      value={bookingQuestion.value}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue
                                          placeholder={t("choose-one")}
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="male">
                                          {t("male")}
                                        </SelectItem>
                                        <SelectItem value="female">
                                          {t("female")}
                                        </SelectItem>
                                        <SelectItem value="other">
                                          {t("gende-other")}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <PaxInfoErrorComponent
                                      value={bookingQuestion.value}
                                      required={bookingQuestion.required}
                                      validator={(arg0: any) => {
                                        if (
                                          (arg0.toString() as string).length > 0
                                        ) {
                                          return false;
                                        }
                                        return "invalid-gender";
                                      }}
                                    />
                                  </div>
                                );
                              case "ORGANIZATION":
                                return (
                                  <div
                                    key={bookingQuestion.type}
                                    className="w-full flex flex-col gap-2 items-start"
                                  >
                                    <FormLabel>{t("company-name")}</FormLabel>
                                    <Input
                                      value={bookingQuestion.value}
                                      onChange={(e) => {
                                        handleMainPaxChange(
                                          step,
                                          bookingQuestion.id,
                                          e.target.value
                                        );
                                      }}
                                      type="text"
                                      className="w-full"
                                    />
                                    <PaxInfoErrorComponent
                                      value={bookingQuestion.value}
                                      required={bookingQuestion.required}
                                      validator={(arg0: any) => {
                                        if (
                                          (arg0.toString() as string).trim()
                                            .length >= 2
                                        ) {
                                          return false;
                                        }
                                        return "invalid-company";
                                      }}
                                    />
                                  </div>
                                );
                              case "PASSPORT_ID":
                                return (
                                  <div
                                    key={bookingQuestion.type}
                                    className="w-full flex flex-col gap-2 items-start"
                                  >
                                    <FormLabel>
                                      {t("passport-number")}
                                    </FormLabel>
                                    <Input
                                      value={bookingQuestion.value}
                                      onChange={(e) => {
                                        handleMainPaxChange(
                                          step,
                                          bookingQuestion.id,
                                          e.target.value
                                        );
                                      }}
                                      type="text"
                                      className="w-full"
                                    />
                                    <PaxInfoErrorComponent
                                      value={bookingQuestion.value}
                                      required={bookingQuestion.required}
                                      validator={(arg0: any) => {
                                        const regex = /^[A-Z0-9]{6,12}$/i;
                                        if (
                                          regex.test(
                                            (arg0.toString() as string).trim()
                                          )
                                        ) {
                                          return false;
                                        }
                                        return "invalid-passport";
                                      }}
                                    />
                                  </div>
                                );
                              case "PASSPORT_EXPIRY":
                                return (
                                  <div
                                    key={bookingQuestion.type}
                                    className="w-full flex flex-col gap-2 items-start"
                                  >
                                    <FormLabel>
                                      {t("passport-expiry")}
                                    </FormLabel>
                                    <Input
                                      value={bookingQuestion.value}
                                      onChange={(e) => {
                                        handleMainPaxChange(
                                          step,
                                          bookingQuestion.id,
                                          e.target.value
                                        );
                                      }}
                                      type="number"
                                      className="w-full"
                                    />
                                    <PaxInfoErrorComponent
                                      value={bookingQuestion.value}
                                      required={bookingQuestion.required}
                                      validator={(arg0: any) => {
                                        const regex =
                                          /^(0[1-9]|1[0-2])\/\d{2}$/;
                                        if (
                                          regex.test(
                                            (arg0.toString() as string).trim()
                                          )
                                        ) {
                                          return false;
                                        }
                                        return "invalid-expiry";
                                      }}
                                    />
                                  </div>
                                );
                              case "DATE_OF_BIRTH":
                                return (
                                  <div
                                    key={bookingQuestion.type}
                                    className="w-full flex flex-col gap-2 items-start"
                                  >
                                    <FormLabel>{t("birthdate")}</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                        type="button"
                                          variant="outline"
                                          id="date"
                                          className="w-full justify-between font-normal"
                                        >
                                          {bookingQuestion.value
                                            ? bookingQuestion.value
                                            : t("select-date")}
                                          <CalendarIcon />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        className="w-auto overflow-hidden p-0"
                                        align="start"
                                      >
                                        <Calendar
                                          selected={
                                            bookingQuestion.value
                                              ? parse(
                                                  bookingQuestion.value,
                                                  "yyyy-MM-dd",
                                                  new Date()
                                                )
                                              : undefined
                                          }
                                          onSelect={(date) => {
                                            handleMainPaxChange(
                                              step,
                                              bookingQuestion.id,
                                              date
                                                ? format(date, "yyyy-MM-dd")
                                                : ""
                                            );
                                          }}
                                          mode="single"
                                          captionLayout="dropdown"
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    <PaxInfoErrorComponent
                                      value={bookingQuestion.value}
                                      required={bookingQuestion.required}
                                      validator={(arg0: any) => {
                                        try {
                                          const parsed = parse(
                                            arg0.toString() as string,
                                            "yyyy-MM-dd",
                                            new Date()
                                          );
                                          if (parsed) {
                                            return false;
                                          }
                                          return "invalid-date";
                                        } catch {
                                          return "invalid-date";
                                        }
                                      }}
                                    />
                                  </div>
                                );
                              case "LANGUAGE":
                                return (
                                  <div
                                    key={bookingQuestion.type}
                                    className="w-full flex flex-col gap-2 items-start"
                                  >
                                    <FormLabel>{t("your-language")}</FormLabel>
                                    <CountrySelect
                                      placeholder={t("lang-placeholder")}
                                      value={bookingQuestion.value}
                                      onChange={(e) => {
                                        handleMainPaxChange(
                                          step,
                                          bookingQuestion.id,
                                          e
                                        );
                                      }}
                                      className="w-full"
                                    />
                                    <PaxInfoErrorComponent
                                      value={bookingQuestion.value}
                                      required={bookingQuestion.required}
                                      validator={(arg0: any) => {
                                        if (
                                          (arg0.toString() as string).length > 0
                                        ) {
                                          return false;
                                        }
                                        return "invalid-language";
                                      }}
                                    />
                                  </div>
                                );
                            }
                          }
                        })}
                      </>
                    )}
                  </div>
                </>
              )}
              {activities[step].otherPaxInfo &&
                activities[step].otherPaxInfo.length > 0 &&
                Object.values(activities[step].guests).reduce(
                  (prev, curr) => (prev += curr),
                  0
                ) -
                  1 >
                  0 && (
                  <>
                    <p className="sm:text-base text-sm pb-1 border-b-2 w-fit pr-4 border-b-primary font-semibold">
                      {t("other-travelers-info")}{" "}
                      {`${
                        otherPaxAnswers[step].filter(
                          (answer) => !answer.some((ans) => !ans.touched)
                        ).length
                      }/${
                        Object.values(activities[step].guests).reduce(
                          (prev, curr) => (prev += curr),
                          0
                        ) - 1
                      }`}
                    </p>
                    <div className="flex flex-row items-center justify-start gap-2 flex-wrap">
                      {otherPaxAnswers[step]
                        .filter((answer) => !answer.some((ans) => !ans.touched))
                        .map((otherPaxAnswer, indx) => {
                          return (
                            <Button
                            type="button"
                              key={indx}
                              onClick={() => {
                                const currentAnswers: Record<string, string> =
                                  {};
                                for (const answer of otherPaxAnswer) {
                                  currentAnswers[answer.id] = answer.value;
                                }
                                setOtherPaxCurrentAnswers(currentAnswers);
                                setAddOtherPaxDialogIndx(indx);
                                setAddOtherPaxDialogOpen(true);
                              }}
                              variant={"secondary"}
                              className="h-fit! w-fit p-2 rounded-full relative"
                            >
                              P{indx + 1}
                              <Edit2 className="w-2 h-2 text-primary absolute -right-1 -top-1" />
                            </Button>
                          );
                        })}

                      <Dialog
                        open={addOtherPaxDialogOpen}
                        onOpenChange={(b) => {
                          if (!b) {
                            setAddOtherPaxDialogIndx(undefined);
                            setOtherPaxCurrentAnswers({});
                          }
                          setAddOtherPaxDialogOpen(b);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                          type="button"
                            variant={"secondary"}
                            className={cn(
                              "h-fit! w-fit p-2 rounded-full",
                              otherPaxAnswers[step].filter(
                                (answer) => !answer.some((ans) => !ans.touched)
                              ).length <
                                Object.values(activities[step].guests).reduce(
                                  (prev, curr) => (prev += curr),
                                  0
                                ) -
                                  1
                                ? "flex"
                                : "hidden"
                            )}
                          >
                            <Plus />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t("add-other-title")}</DialogTitle>
                            <DialogDescription>
                              {t("other-guests-desc")}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="w-full flex flex-col gap-2 items-start">
                            <Separator className="mb-4 bg-primary w-full h-[2px]" />
                            {otherPaxAnswers[step].length > 0 && (
                              <>
                                {otherPaxAnswers[step][
                                  addOtherPaxDialogIndex ??  otherPaxAnswers[step].filter(
                                    (answer) => !answer.some((ans) => !ans.touched)
                                  ).length
                                ]?.map((bookingQuestion) => {
                                  if (isPaxBookingQuestion(bookingQuestion)) {
                                    return (
                                      <div
                                        key={bookingQuestion.id}
                                        className="flex flex-col gap-1 w-full items-start"
                                      >
                                        <FormLabel>
                                          {bookingQuestion.label}
                                          {bookingQuestion.required && (
                                            <span className="text-xs font-semibold text-destructive">
                                              *
                                            </span>
                                          )}
                                        </FormLabel>
                                        {(() => {
                                          switch (bookingQuestion.dataType) {
                                            case "SHORT_TEXT":
                                              return (
                                                <Input
                                                  value={
                                                    otherPaxCurrentAnswers[
                                                      bookingQuestion.id
                                                    ] ?? ""
                                                  }
                                                  onChange={(e) => {
                                                    setOtherPaxCurrentAnswers(
                                                      (prev) => {
                                                        return {
                                                          ...prev,
                                                          [bookingQuestion.id]:
                                                            e.target.value,
                                                        };
                                                      }
                                                    );
                                                  }}
                                                  placeholder={
                                                    bookingQuestion.placeholder ??
                                                    ""
                                                  }
                                                  className="w-full"
                                                />
                                              );
                                            case "LONG_TEXT":
                                              return (
                                                <Textarea
                                                  value={
                                                    otherPaxCurrentAnswers[
                                                      bookingQuestion.id
                                                    ] ?? ""
                                                  }
                                                  onChange={(e) => {
                                                    setOtherPaxCurrentAnswers(
                                                      (prev) => {
                                                        return {
                                                          ...prev,
                                                          [bookingQuestion.id]:
                                                            e.target.value,
                                                        };
                                                      }
                                                    );
                                                  }}
                                                  placeholder={
                                                    bookingQuestion.placeholder ??
                                                    ""
                                                  }
                                                  className="w-full resize-none h-16"
                                                />
                                              );
                                            case "INT":
                                              return (
                                                <Input
                                                  value={
                                                    otherPaxCurrentAnswers[
                                                      bookingQuestion.id
                                                    ] ?? ""
                                                  }
                                                  onChange={(e) => {
                                                    setOtherPaxCurrentAnswers(
                                                      (prev) => {
                                                        return {
                                                          ...prev,
                                                          [bookingQuestion.id]:
                                                            e.target.value,
                                                        };
                                                      }
                                                    );
                                                  }}
                                                  placeholder={
                                                    bookingQuestion.placeholder ??
                                                    ""
                                                  }
                                                  type="number"
                                                  step={1}
                                                  className="w-full"
                                                />
                                              );
                                            case "DOUBLE":
                                              return (
                                                <Input
                                                  value={
                                                    otherPaxCurrentAnswers[
                                                      bookingQuestion.id
                                                    ] ?? ""
                                                  }
                                                  onChange={(e) => {
                                                    setOtherPaxCurrentAnswers(
                                                      (prev) => {
                                                        return {
                                                          ...prev,
                                                          [bookingQuestion.id]:
                                                            e.target.value,
                                                        };
                                                      }
                                                    );
                                                  }}
                                                  placeholder={
                                                    bookingQuestion.placeholder ??
                                                    ""
                                                  }
                                                  type="number"
                                                  step="any"
                                                  className="w-full"
                                                />
                                              );
                                            case "BOOLEAN":
                                              return <>BOOLEAN</>;
                                            case "CHECKBOX_TOGGLE":
                                              return <>CHECKBOX</>;
                                            case "DATE":
                                              return <>DATE</>;
                                            case "DATE_AND_TIME":
                                              return <>DATE_AND_TIME</>;
                                            case "OPTIONS":
                                              return <>OPTIONS</>;
                                          }
                                        })()}
                                      </div>
                                    );
                                  }
                                  if (isPaxInfoQuestion(bookingQuestion)) {
                                    switch (bookingQuestion.type) {
                                      case "FIRST_NAME":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>
                                              {t("first-name")}
                                            </FormLabel>
                                            <Input
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              onChange={(e) => {
                                                setOtherPaxCurrentAnswers(
                                                  (prev) => {
                                                    return {
                                                      ...prev,
                                                      [bookingQuestion.id]:
                                                        e.target.value,
                                                    };
                                                  }
                                                );
                                              }}
                                              type="text"
                                              className="w-full"
                                            />
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={(arg0: any) => {
                                                if (
                                                  (
                                                    arg0.toString() as string
                                                  ).trim().length > 2
                                                ) {
                                                  return false;
                                                }
                                                return "invalid-first-name";
                                              }}
                                            />
                                          </div>
                                        );
                                      case "LAST_NAME":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>
                                              {t("last-name")}
                                            </FormLabel>
                                            <Input
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              onChange={(e) => {
                                                setOtherPaxCurrentAnswers(
                                                  (prev) => {
                                                    return {
                                                      ...prev,
                                                      [bookingQuestion.id]:
                                                        e.target.value,
                                                    };
                                                  }
                                                );
                                              }}
                                              type="text"
                                              className="w-full"
                                            />
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={(arg0: any) => {
                                                if (
                                                  (
                                                    arg0.toString() as string
                                                  ).trim().length > 2
                                                ) {
                                                  return false;
                                                }
                                                return "invalid-last-name";
                                              }}
                                            />
                                          </div>
                                        );
                                      case "EMAIL":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>{t("email")}</FormLabel>
                                            <Input
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              onChange={(e) => {
                                                setOtherPaxCurrentAnswers(
                                                  (prev) => {
                                                    return {
                                                      ...prev,
                                                      [bookingQuestion.id]:
                                                        e.target.value,
                                                    };
                                                  }
                                                );
                                              }}
                                              type="email"
                                              className="w-full"
                                            />
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={(arg0: any) => {
                                                const regex =
                                                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                if (
                                                  regex.test(
                                                    (
                                                      arg0.toString() as string
                                                    ).trim()
                                                  )
                                                ) {
                                                  return false;
                                                }
                                                return "invalid-email";
                                              }}
                                            />
                                          </div>
                                        );
                                      case "PHONE_NUMBER":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>{t("phone")}</FormLabel>
                                            <PhoneInput
                                              defaultCountry="PT"
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              onChange={(e) => {
                                                setOtherPaxCurrentAnswers(
                                                  (prev) => {
                                                    return {
                                                      ...prev,
                                                      [bookingQuestion.id]: e,
                                                    };
                                                  }
                                                );
                                              }}
                                              className="w-full"
                                            />
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={(arg0: any) => {
                                                if (
                                                  (
                                                    arg0.toString() as string
                                                  ).trim().length > 0
                                                ) {
                                                  return false;
                                                }
                                                return "invalid-phone";
                                              }}
                                            />
                                          </div>
                                        );
                                      case "ADDRESS":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>
                                              {t("full-address")}
                                            </FormLabel>
                                            <Input
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              onChange={(e) => {
                                                setOtherPaxCurrentAnswers(
                                                  (prev) => {
                                                    return {
                                                      ...prev,
                                                      [bookingQuestion.id]:
                                                        e.target.value,
                                                    };
                                                  }
                                                );
                                              }}
                                              type="text"
                                              className="w-full"
                                            />
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={(arg0: any) => {
                                                if (
                                                  (
                                                    arg0.toString() as string
                                                  ).trim().length >= 2
                                                ) {
                                                  return false;
                                                }
                                                return "invalid-address";
                                              }}
                                            />
                                          </div>
                                        );
                                      case "TITLE":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>{t("title")}</FormLabel>
                                            <Select
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              onValueChange={(e) => {
                                                setOtherPaxCurrentAnswers(
                                                  (prev) => {
                                                    return {
                                                      ...prev,
                                                      [bookingQuestion.id]: e,
                                                    };
                                                  }
                                                );
                                              }}
                                              defaultValue="sr"
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue
                                                  placeholder={t("choose-one")}
                                                />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="sr">
                                                  {t("sr")}
                                                </SelectItem>
                                                <SelectItem value="mrs">
                                                  {t("msr")}
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={(arg0: any) => {
                                                if (
                                                  (arg0.toString() as string)
                                                    .length > 0
                                                ) {
                                                  return false;
                                                }
                                                return "invalid-language";
                                              }}
                                            />
                                          </div>
                                        );
                                      case "PERSONAL_ID_NUMBER":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>
                                              {t("cc-number-title")}
                                            </FormLabel>
                                            <Input
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              onChange={(e) => {
                                                setOtherPaxCurrentAnswers(
                                                  (prev) => {
                                                    return {
                                                      ...prev,
                                                      [bookingQuestion.id]:
                                                        e.target.value,
                                                    };
                                                  }
                                                );
                                              }}
                                              type="text"
                                              className="w-full"
                                            />
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={(arg0: any) => {
                                                const regex =
                                                  /^[A-Z0-9]{6,15}$/i;
                                                if (
                                                  regex.test(
                                                    (
                                                      arg0.toString() as string
                                                    ).trim()
                                                  )
                                                ) {
                                                  return false;
                                                }
                                                return "invalid-cc";
                                              }}
                                            />
                                          </div>
                                        );
                                      case "NATIONALITY":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>
                                              {t("nationality")}
                                            </FormLabel>
                                            <CountrySelect
                                              placeholder={t(
                                                "choose-nationality"
                                              )}
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              onChange={(e) => {
                                                setOtherPaxCurrentAnswers(
                                                  (prev) => {
                                                    return {
                                                      ...prev,
                                                      [bookingQuestion.id]: e,
                                                    };
                                                  }
                                                );
                                              }}
                                              className="w-full"
                                            />
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ??
                                                ""?.toString() ??
                                                ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={() => {
                                                return false;
                                              }}
                                            />
                                          </div>
                                        );
                                      case "GENDER":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>{t("gender")}</FormLabel>
                                            <Select
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              onValueChange={(e) => {
                                                setOtherPaxCurrentAnswers(
                                                  (prev) => {
                                                    return {
                                                      ...prev,
                                                      [bookingQuestion.id]: e,
                                                    };
                                                  }
                                                );
                                              }}
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue
                                                  placeholder={t("choose-one")}
                                                />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="male">
                                                  {t("male")}
                                                </SelectItem>
                                                <SelectItem value="female">
                                                  {t("female")}
                                                </SelectItem>
                                                <SelectItem value="other">
                                                  {t("gende-other")}
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ??
                                                ""?.toString() ??
                                                ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={() => {
                                                return false;
                                              }}
                                            />
                                          </div>
                                        );
                                      case "ORGANIZATION":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>
                                              {t("company-name")}
                                            </FormLabel>
                                            <Input
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              onChange={(e) => {
                                                setOtherPaxCurrentAnswers(
                                                  (prev) => {
                                                    return {
                                                      ...prev,
                                                      [bookingQuestion.id]:
                                                        e.target.value,
                                                    };
                                                  }
                                                );
                                              }}
                                              type="text"
                                              className="w-full"
                                            />
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={(arg0: any) => {
                                                if (
                                                  (
                                                    arg0.toString() as string
                                                  ).trim().length >= 2
                                                ) {
                                                  return false;
                                                }
                                                return "invalid-company";
                                              }}
                                            />
                                          </div>
                                        );
                                      case "PASSPORT_ID":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>
                                              {t("passport-number")}
                                            </FormLabel>
                                            <Input
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              onChange={(e) => {
                                                setOtherPaxCurrentAnswers(
                                                  (prev) => {
                                                    return {
                                                      ...prev,
                                                      [bookingQuestion.id]:
                                                        e.target.value,
                                                    };
                                                  }
                                                );
                                              }}
                                              type="text"
                                              className="w-full"
                                            />
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={(arg0: any) => {
                                                const regex =
                                                  /^[A-Z0-9]{6,12}$/i;
                                                if (
                                                  regex.test(
                                                    (
                                                      arg0.toString() as string
                                                    ).trim()
                                                  )
                                                ) {
                                                  return false;
                                                }
                                                return "invalid-cc";
                                              }}
                                            />
                                          </div>
                                        );
                                      case "PASSPORT_EXPIRY":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>
                                              {t("passport-expiry")}
                                            </FormLabel>
                                            <Input
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              onChange={(e) => {
                                                setOtherPaxCurrentAnswers(
                                                  (prev) => {
                                                    return {
                                                      ...prev,
                                                      [bookingQuestion.id]:
                                                        e.target.value,
                                                    };
                                                  }
                                                );
                                              }}
                                              type="number"
                                              className="w-full"
                                            />
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={(arg0: any) => {
                                                const regex =
                                                  /^(0[1-9]|1[0-2])\/\d{2}$/;
                                                if (
                                                  regex.test(
                                                    (
                                                      arg0.toString() as string
                                                    ).trim()
                                                  )
                                                ) {
                                                  return false;
                                                }
                                                return "invalid-cc";
                                              }}
                                            />
                                          </div>
                                        );
                                      case "DATE_OF_BIRTH":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>
                                              {t("birthdate")}
                                            </FormLabel>
                                            <Popover
                                              open={addOtherPaxBirthdayOpen}
                                              onOpenChange={
                                                setAddOtherPaxBirthdayOpen
                                              }
                                            >
                                              <PopoverTrigger asChild>
                                                <Button
                                                type="button"
                                                  variant="outline"
                                                  id="date"
                                                  className="w-full justify-between font-normal"
                                                >
                                                  {(otherPaxCurrentAnswers[
                                                    bookingQuestion.id
                                                  ] ?? "") == ""
                                                    ? "Select date"
                                                    : otherPaxCurrentAnswers[
                                                        bookingQuestion.id
                                                      ]}
                                                  <CalendarIcon />
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent
                                                className="w-auto overflow-hidden p-0 z-99"
                                                align="start"
                                              >
                                                <Calendar
                                                  selected={
                                                    (otherPaxCurrentAnswers[
                                                      bookingQuestion.id
                                                    ] ?? "") != ""
                                                      ? parse(
                                                          otherPaxCurrentAnswers[
                                                            bookingQuestion.id
                                                          ]!,
                                                          "yyyy-MM-dd",
                                                          new Date()
                                                        )
                                                      : undefined
                                                  }
                                                  onSelect={(date) => {
                                                    setOtherPaxCurrentAnswers(
                                                      (prev) => {
                                                        return {
                                                          ...prev,
                                                          [bookingQuestion.id]:
                                                            date
                                                              ? format(
                                                                  date,
                                                                  "yyyy-MM-dd"
                                                                )
                                                              : "",
                                                        };
                                                      }
                                                    );
                                                    setAddOtherPaxBirthdayOpen(
                                                      false
                                                    );
                                                  }}
                                                  mode="single"
                                                  captionLayout="dropdown"
                                                />
                                              </PopoverContent>
                                            </Popover>
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={(arg0: any) => {
                                                try {
                                                  const parsed = parse(
                                                    arg0.toString() as string,
                                                    "yyyy-MM-dd",
                                                    new Date()
                                                  );
                                                  if (parsed) {
                                                    return false;
                                                  }
                                                  return "invalid-date";
                                                } catch {
                                                  return "invalid-date";
                                                }
                                              }}
                                            />
                                          </div>
                                        );
                                      case "LANGUAGE":
                                        return (
                                          <div
                                            key={bookingQuestion.type}
                                            className="w-full flex flex-col gap-2 items-start"
                                          >
                                            <FormLabel>
                                              {t("your-language")}
                                            </FormLabel>
                                            <CountrySelect
                                              placeholder={t(
                                                "lang-placeholder"
                                              )}
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              onChange={(e) => {
                                                setOtherPaxCurrentAnswers(
                                                  (prev) => {
                                                    return {
                                                      ...prev,
                                                      [bookingQuestion.id]: e,
                                                    };
                                                  }
                                                );
                                              }}
                                              className="w-full"
                                            />
                                            <PaxInfoErrorComponent
                                              value={
                                                otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? ""
                                              }
                                              required={
                                                bookingQuestion.required
                                              }
                                              validator={(arg0: any) => {
                                                if (
                                                  (arg0.toString() as string)
                                                    .length > 0
                                                ) {
                                                  return false;
                                                }
                                                return "invalid-language";
                                              }}
                                            />
                                          </div>
                                        );
                                    }
                                  }
                                  
                                })}
                              </>
                            )}
                          </div>
                          <Button
                          type="button"
                            onClick={() => {
                              const index =
                                addOtherPaxDialogIndex ??
                                otherPaxAnswers[step].filter(
                                  (answer) =>
                                    !answer.some((ans) => !ans.touched)
                                ).length;
                              handleOtherPaxBulkChange(
                                step,
                                index,
                                otherPaxCurrentAnswers
                              );
                              setAddOtherPaxDialogIndx(undefined);
                              setAddOtherPaxDialogOpen(false);
                              setOtherPaxCurrentAnswers({});
                            }}
                          >
                            {t("add-traveler-info")}
                          </Button>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </>
                )}
              <Button type="button" onClick={()=>{
                handleSubmitAnswers(step)
              }} className="w-full">
                {step == activities.length - 1
                  ? t("proceed-payment")
                  : t("continue")}{" "}
                <ArrowRight />
              </Button>
              {questionsError && (
                <p className="text-xs font-semibold text-destructive w-full text-center">
                  {questionsError}
                </p>
              )}
            </div>
          )}

          {step == "paying" && (
            <>
              {addressData && (
                <Card className="p-2 text-sm flex flex-row gap-2 items-start">
                  <div className="flex sm:flex-row flex-col grow items-start sm:gap-2">
                    <div className="flex flex-col gap-0 items-start grow">
                      <p className="font-semibold">
                        {addressData?.name ??
                          `${addressData.firstName} ${addressData.lastName}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {clientInfo.getValues("email")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {addressData.phone}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0 items-start grow">
                      <p className="font-semibold">
                        {clientInfo.getValues("vat")}
                      </p>
                      <p className="text-sm text-muted-foreground max-w-[200px]">
                        {`${addressData.address.line1}${
                          addressData.address.line2
                            ? " " + addressData.address.line2
                            : ""
                        }, ${addressData.address.postal_code} ${
                          addressData.address.country
                        }`}
                      </p>
                    </div>
                  </div>

                  <Button
                  type="button"
                    disabled={!stripe || loading || priceLoading}
                    onClick={() => {
                      setStep("client_info");
                    }}
                    variant={"ghost"}
                    className="h-fit! p-1! text-xs gap-1"
                  >
                    {t("edit")} <Edit3 />
                  </Button>
                </Card>
              )}

              <Separator />
              <Tabs
                value={selectedTab}
                onValueChange={(e) => {
                  selectTab(e);
                }}
              >
                <TabsList className="w-full flex flex-row items-center">
                  <TabsTrigger value="card" className="px-4">
                    <Image src={cardSvg} alt="Card-icon" />
                    {t("card")}
                  </TabsTrigger>
                  <TabsTrigger value="sepa" className="px-4">
                    <Image src={sepaSvg} alt="Sepa-icon" />
                    SEPA Direct Debit
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {selectedTab == "card" && (
                <>
                  <div className="flex flex-col w-full gap-1">
                    <label className="block text-sm">{t("card_number")}</label>
                    <div className="p-[10.5px] h-fit! border shadow-xs rounded">
                      <CardNumberElement
                        options={{
                          showIcon: true,
                          disableLink: true,
                          style: {
                            base: {
                              fontFamily:
                                '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <div className="flex-1 flex flex-col items-start gap-1 w-full">
                      <label className="block text-sm">{t("expiry")}</label>
                      <div className="p-[10.5px] h-fit! border shadow-xs rounded w-full">
                        <CardExpiryElement
                          options={{
                            style: {
                              base: {
                                fontFamily:
                                  '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col items-start gap-1 w-full">
                      <label className="block text-sm">{t("cvc")}</label>
                      <div className="p-[10.5px] h-fit! border shadow-xs rounded w-full">
                        <CardCvcElement
                          options={{
                            style: {
                              base: {
                                fontFamily:
                                  '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              {selectedTab == "card" && (
                <Button
                  className="w-full text"
                  type="submit"
                  disabled={!stripe || loading || priceLoading}
                >
                  {priceLoading
                    ? t("loading")
                    : loading
                    ? t(loadingMessage)
                    : t("pay", { amount: _amount / 100 })}
                  {loading && <Loader2 className="animate-spin" />}
                </Button>
              )}
              {selectedTab == "sepa" && (
                <>
                  <div className="flex flex-col w-full gap-1">
                    <label className="block text-sm">IBAN</label>
                    <div className="p-[10.5px] h-fit! border shadow-xs rounded">
                      <IbanElement
                        options={{
                          supportedCountries: ["SEPA"],
                          placeholderCountry: "PT",
                          style: {
                            base: {
                              fontFamily:
                                '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                              fontSize: "14px",
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
              {selectedTab == "sepa" && (
                <Button
                  className="w-full text"
                  type="submit"
                  disabled={!stripe || loading || priceLoading}
                >
                  {priceLoading
                    ? t("loading")
                    : loading
                    ? t(loadingMessage)
                    : t("pay", { amount: _amount / 100 })}
                  {loading && <Loader2 className="animate-spin" />}
                </Button>
              )}
              {paymentRequest && (
                <>
                  <div className="flex flex-row items-center gap-2 w-full">
                    <Separator className="flex-1" />
                    <p className="text-xs shrink-0">{t("or")}</p>
                    <Separator className="flex-1" />
                  </div>
                  <Button
                    type="button"
                    onClick={async () => {
                      const result = await clientInfo.trigger();
                      if (!result) {
                        if (!addressData) {
                          setError("provide_information");
                          return;
                        }
                        return;
                      }
                      if (!addressData) {
                        setError("provide_information");
                        return;
                      }
                      paymentRequest?.show();
                    }}
                    variant={"outline"}
                    className="shadow-xs! rounded p-0! h-fit! bg-black! hover:bg-black/90! text-white!"
                  >
                    <FaApplePay className="h-full! max-h-full! min-h-10! w-auto!" />
                  </Button>
                </>
              )}
            </>
          )}

          {error.includes("_")
            ? error && (
                <p className="text-red-600 text-sm mx-auto">{t(error)}</p>
              )
            : error && <p className="text-red-600 text-sm mx-auto">{error}</p>}
        </form>
      </Form>
    </Card>
  );
};
