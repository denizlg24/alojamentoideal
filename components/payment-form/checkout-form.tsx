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
import { useEffect, useState } from "react";
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
import { Loader2, ArrowRight, Edit3, CalendarIcon } from "lucide-react";
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
import {
  ActivityBookingQuestionsDto,
  categoriesMap,
  isValid,
  PickupPlaceDto,
  QuestionSpecificationDto,
} from "@/utils/bokun-requests";
import { Skeleton } from "../ui/skeleton";
import {
  getShoppingCartQuestion,
  removeActivity,
  startShoppingCart,
} from "@/app/actions/getExperience";
import { PopoverClose } from "@radix-ui/react-popover";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format, parse } from "date-fns";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";

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
  cartId,
}: {
  cartId: string;
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
    rateId: number;
    experienceId: number;
    selectedDate: Date;
    selectedStartTimeId: number | undefined;
    guests: { [categoryId: number]: number };
  }[];
}) => {
  const displayT = useTranslations("tourDisplay");
  const t = useTranslations("checkout_form");
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
  const [mainContactDetails, setMainContactDetails] = useState<
    QuestionSpecificationDto[]
  >([]);
  const [activityBookings, setActivityBookings] = useState<
    ActivityBookingQuestionsDto[]
  >([]);

  const [selectedPickupPlaceId, setPickupPlaceId] = useState<string[]>(
    new Array(activities.length).fill("custom")
  );

  const [pickupQuestionsLoading, setPickupQuestionsLoading] = useState<
    boolean[]
  >(new Array(activities.length).fill(false));

  const router = useRouter();
  useEffect(() => {
    const getAmount = async () => {
      setPriceLoading(true);
      const amount = await calculateAmount(cart);
      for (const activity of cart.filter((item) => item.type == "activity")) {
        const shopping = await startShoppingCart(
          cartId,
          activity.id,
          activity.selectedRateId,
          activity.selectedStartTimeId,
          activity.selectedDate,
          activity.guests
        );
        if (!shopping.success) {
          setError("error-processing-request");
          return;
        }
      }
      const response = await getShoppingCartQuestion(cartId);
      if (!response.success) {
        return;
      }
      const selectedOption = response.options.find(
        (option) => option.type === "CUSTOMER_FULL_PAYMENT"
      );
      setMainContactDetails(response.questions.mainContactDetails);
      setActivityBookings(response.questions.activityBookings);
      setAmount(amount + ((selectedOption?.amount ?? 0) * 100 || 0));
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
      mainContactDetails: mainContactDetails.map((question) => ({
        questionId: question.questionId,
        values: question.answers,
      })),
      activityBookings: activityBookings?.map((activity, indx) => ({
        activityId: activity.activityId,
        answers: activity.questions.map((question) => ({
          questionId: question.questionId,
          values: question.answers,
        })),
        pickupAnswers: activity.pickupQuestions.map((question) => ({
          questionId: question.questionId,
          values: question.answers,
        })),
        pickup: selectedPickupPlaceId[indx] == "custom" ? false : true,
        pickupPlaceId:
          selectedPickupPlaceId[indx] == "custom"
            ? undefined
            : selectedPickupPlaceId[indx],
        rateId: cart.filter((i) => i.type == "activity")[indx].selectedRateId,
        startTimeId:
          cart.filter((i) => i.type == "activity")[indx].selectedStartTimeId ==
          0
            ? undefined
            : cart.filter((i) => i.type == "activity")[indx]
                .selectedStartTimeId,
        date: format(
          cart.filter((i) => i.type == "activity")[indx].selectedDate,
          "yyyy-MM-dd"
        ),
        passengers: activity.passengers.map((passenger) => ({
          pricingCategoryId: passenger.pricingCategoryId,
          groupSize: 1,
          passengerDetails: passenger.passengerDetails.map((question) => ({
            questionId: question.questionId,
            values: question.answers,
          })),
          answers: passenger.questions.map((question) => ({
            questionId: question.questionId,
            values: question.answers,
          })),
        })),
      })),
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

  const updateBookingPickUpQuestions = async (
    bookingId: number,
    tourItem: {
      rateId: number;
      experienceId: number;
      selectedDate: Date;
      selectedStartTimeId: number | undefined;
      guests: { [categoryId: number]: number };
    },
    pickupPlaceId: string | undefined
  ) => {
    const removed = await removeActivity(cartId, bookingId);
    console.log(removed);
    if (removed) {
      await startShoppingCart(
        cartId,
        tourItem.experienceId,
        tourItem.rateId,
        tourItem.selectedStartTimeId == 0
          ? undefined
          : tourItem.selectedStartTimeId,
        tourItem.selectedDate,
        tourItem.guests,
        pickupPlaceId
      );
      const response = await getShoppingCartQuestion(cartId);

      if (!response.success) {
        return;
      }
      const newBookingId =
        response.questions.activityBookings[
          response.questions.activityBookings.length - 1
        ].bookingId;
      const newPickUpQuestion =
        response.questions.activityBookings[
          response.questions.activityBookings.length - 1
        ].pickupQuestions;
      setActivityBookings((prev) =>
        prev.map((activity, i) =>
          i == step
            ? {
                ...activity,
                bookingId: newBookingId ?? 0,
                pickupQuestions: newPickUpQuestion ?? [],
              }
            : activity
        )
      );
    }
  };

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
          mainContactDetails: mainContactDetails.map((question) => ({
            questionId: question.questionId,
            values: question.answers,
          })),
          activityBookings: activityBookings?.map((activity, indx) => ({
            activityId: activity.activityId,
            answers: activity.questions.map((question) => ({
              questionId: question.questionId,
              values: question.answers,
            })),
            pickupAnswers: activity.pickupQuestions.map((question) => ({
              questionId: question.questionId,
              values: question.answers,
            })),
            pickup: selectedPickupPlaceId[indx] == "custom" ? false : true,
            pickupPlaceId:
              selectedPickupPlaceId[indx] == "custom"
                ? undefined
                : selectedPickupPlaceId[indx],
            rateId: cart.filter((i) => i.type == "activity")[indx]
              .selectedRateId,
            startTimeId:
              cart.filter((i) => i.type == "activity")[indx]
                .selectedStartTimeId == 0
                ? undefined
                : cart.filter((i) => i.type == "activity")[indx]
                    .selectedStartTimeId,
            date: format(
              cart.filter((i) => i.type == "activity")[indx].selectedDate,
              "yyyy-MM-dd"
            ),
            passengers: activity.passengers.map((passenger) => ({
              pricingCategoryId: passenger.pricingCategoryId,
              groupSize: 1,
              passengerDetails: passenger.passengerDetails.map((question) => ({
                questionId: question.questionId,
                values: question.answers,
              })),
              answers: passenger.questions.map((question) => ({
                questionId: question.questionId,
                values: question.answers,
              })),
            })),
          })),
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
    mainContactDetails,
    activityBookings,
    selectedPickupPlaceId,
  ]);

  if (checking) return <Skeleton className="w-full h-full min-h-[250px]" />;

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

          {typeof step == "number" && (
            <div className="w-full flex flex-col gap-4">
              {activityBookings[step]?.questions.length > 0 && (
                <div className="w-full flex flex-col gap-2 items-start">
                  <p className="w-fit max-w-full pr-4 border-b-2 border-primary text-base font-semibold">
                    {t("booking-details")}
                  </p>
                  {activityBookings[step].questions.map((question) => {
                    if (
                      question.dataType == "OPTIONS" ||
                      question.selectFromOptions
                    ) {
                      return (
                        <div
                          key={question.questionId}
                          className="w-full flex flex-col gap-1 items-start"
                        >
                          <Label className="text-sm font-normal">
                            {question.label}
                            {question.required && (
                              <span className="text-xs text-destructive">
                                *
                              </span>
                            )}
                          </Label>
                          <Select
                            defaultValue={question.defaultValue ?? undefined}
                            value={question.answers ? question.answers[0] : ""}
                            onValueChange={(v) =>
                              setActivityBookings((prev) =>
                                prev.map((activity, indx) =>
                                  indx == step
                                    ? {
                                        ...activity,
                                        questions: activity.questions.map((q) =>
                                          q.questionId == question.questionId
                                            ? { ...q, answers: [v] }
                                            : q
                                        ),
                                      }
                                    : activity
                                )
                              )
                            }
                          >
                            <SelectTrigger
                              className={cn(
                                "w-full",
                                ((question.answers
                                  ? question.answers[0]
                                  : "") == "" &&
                                  question.required) ||
                                  !isValid(
                                    question.answers?.[0] ?? "",
                                    question.dataFormat
                                  )
                                  ? "border border-destructive"
                                  : ""
                              )}
                            >
                              <SelectValue
                                placeholder={
                                  question.placeholder ?? t("choose-one")
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {question.answerOptions.map((option) => {
                                if (option.value && option.label)
                                  return (
                                    <SelectItem
                                      value={option.value}
                                      key={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }
                    if (
                      question.dataType == "CHECKBOX_TOGGLE" ||
                      question.dataType == "BOOLEAN"
                    ) {
                      return (
                        <div
                          key={question.questionId}
                          className="w-full flex flex-row gap-1 items-center"
                        >
                          <Checkbox
                            checked={
                              (question.answers ? question.answers[0] : "no") !=
                              "no"
                            }
                            onCheckedChange={(c) => {
                              setActivityBookings((prev) =>
                                prev.map((activity, indx) =>
                                  indx == step
                                    ? {
                                        ...activity,
                                        questions: activity.questions.map((q) =>
                                          q.questionId == question.questionId
                                            ? {
                                                ...q,
                                                answers: [c ? "yes" : "no"],
                                              }
                                            : q
                                        ),
                                      }
                                    : activity
                                )
                              );
                            }}
                          />
                          <Label className="text-sm font-normal">
                            {question.label}
                            {question.required && (
                              <span className="text-xs text-destructive">
                                *
                              </span>
                            )}
                          </Label>
                        </div>
                      );
                    }
                    if (question.dataType == "DATE") {
                      return (
                        <div
                          key={question.questionId}
                          className="w-full flex flex-col gap-1 items-start"
                        >
                          <Label className="text-sm font-normal">
                            {question.label}
                            {question.required && (
                              <span className="text-xs text-destructive">
                                *
                              </span>
                            )}
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                data-empty={
                                  (question.answers
                                    ? question.answers[0]
                                    : "") == ""
                                }
                                className={
                                  "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal data-[empty=true]:border data-[empty=true]:border-destructive"
                                }
                              >
                                <CalendarIcon />
                                {(question.answers
                                  ? question.answers[0]
                                  : "") != "" ? (
                                  format(question.answers[0], "PPP")
                                ) : (
                                  <span>{t("select-date")}</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                defaultMonth={
                                  question.answers
                                    ? parse(
                                        question.answers[0],
                                        "yyyy-MM-dd",
                                        new Date()
                                      )
                                    : undefined
                                }
                                disabled={(d) => d > new Date()}
                                captionLayout="dropdown"
                                showOutsideDays={false}
                                mode="single"
                                selected={
                                  question.answers
                                    ? parse(
                                        question.answers[0],
                                        "yyyy-MM-dd",
                                        new Date()
                                      )
                                    : undefined
                                }
                                onSelect={(date) => {
                                  if (!date) {
                                    setActivityBookings((prev) =>
                                      prev.map((activity, indx) =>
                                        indx == step
                                          ? {
                                              ...activity,
                                              questions: activity.questions.map(
                                                (q) =>
                                                  q.questionId ==
                                                  question.questionId
                                                    ? { ...q, answers: [""] }
                                                    : q
                                              ),
                                            }
                                          : activity
                                      )
                                    );
                                  } else {
                                    setActivityBookings((prev) =>
                                      prev.map((activity, indx) =>
                                        indx == step
                                          ? {
                                              ...activity,
                                              questions: activity.questions.map(
                                                (q) =>
                                                  q.questionId ==
                                                  question.questionId
                                                    ? {
                                                        ...q,
                                                        answers: [
                                                          format(
                                                            date,
                                                            "yyyy-MM-dd"
                                                          ),
                                                        ],
                                                      }
                                                    : q
                                              ),
                                            }
                                          : activity
                                      )
                                    );
                                  }
                                  document
                                    .querySelector<HTMLButtonElement>(
                                      `[data-popover-close="${question.questionId}"]`
                                    )
                                    ?.click();
                                }}
                              />
                              <PopoverClose asChild>
                                <button
                                  type="button"
                                  hidden
                                  data-popover-close={question.questionId}
                                />
                              </PopoverClose>
                            </PopoverContent>
                          </Popover>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={question.questionId}
                        className="w-full flex flex-col gap-1 items-start"
                      >
                        <Label className="text-sm font-normal">
                          {question.label}
                          {question.required && (
                            <span className="text-xs text-destructive">*</span>
                          )}
                        </Label>
                        <Input
                          value={question.answers ? question.answers[0] : ""}
                          onChange={(e) => {
                            setActivityBookings((prev) =>
                              prev.map((activity, indx) =>
                                indx == step
                                  ? {
                                      ...activity,
                                      questions: activity.questions.map((q) =>
                                        q.questionId == question.questionId
                                          ? { ...q, answers: [e.target.value] }
                                          : q
                                      ),
                                    }
                                  : activity
                              )
                            );
                          }}
                          className={cn(
                            "w-full",
                            ((question.answers ? question.answers[0] : "") ==
                              "" &&
                              question.required) ||
                              !isValid(
                                question.answers?.[0] ?? "",
                                question.dataFormat
                              )
                              ? "border border-destructive"
                              : ""
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              {activities[step].meeting.type != "MEET_ON_LOCATION" && (
                <div className="w-full flex flex-col gap-2 items-start">
                  <p className="w-fit max-w-full pr-4 border-b-2 border-primary text-base font-semibold">
                    {t("pickup-details")}
                  </p>

                  <div className="w-full flex flex-col gap-1 items-start">
                    <Label className="text-sm font-normal">
                      {t("pickup-place")}
                    </Label>
                    <Select
                      disabled={pickupQuestionsLoading[step]}
                      value={selectedPickupPlaceId[step] || "custom"}
                      onValueChange={async (v) => {
                        setPickupPlaceId((prev) =>
                          prev.map((old, i) => (i == step ? v : old))
                        );
                        setPickupQuestionsLoading((prev) =>
                          prev.map((old, i) => (i == step ? true : old))
                        );
                        await updateBookingPickUpQuestions(
                          activityBookings[step].bookingId,
                          activities[step],
                          v == "custom" ? undefined : v
                        );
                        setPickupQuestionsLoading((prev) =>
                          prev.map((old, i) => (i == step ? false : old))
                        );
                      }}
                    >
                      <SelectTrigger className={cn("w-full")}>
                        <SelectValue placeholder={t("choose-one")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={"custom"}>
                          {t("i-want-to-select-my-own")}
                        </SelectItem>
                        {activities[step].meeting.pickUpPlaces.map((option) => {
                          return (
                            <SelectItem
                              value={option.id.toString()}
                              key={option.id}
                            >
                              {option.title}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {pickupQuestionsLoading[step] && (
                    <Skeleton className="w-full h-[80px]" />
                  )}
                  {!pickupQuestionsLoading[step] &&
                    activityBookings[step].pickupQuestions.map((question) => {
                      if (
                        question.dataType == "OPTIONS" ||
                        question.selectFromOptions
                      ) {
                        return (
                          <div
                            key={question.questionId}
                            className="w-full flex flex-col gap-1 items-start"
                          >
                            <Label className="text-sm font-normal">
                              {question.label}
                              {question.required && (
                                <span className="text-xs text-destructive">
                                  *
                                </span>
                              )}
                            </Label>
                            <Select
                              defaultValue={question.defaultValue ?? undefined}
                              value={
                                question.answers ? question.answers[0] : ""
                              }
                              onValueChange={(v) =>
                                setActivityBookings((prev) =>
                                  prev.map((activity, indx) =>
                                    indx == step
                                      ? {
                                          ...activity,
                                          questions:
                                            activity.pickupQuestions.map((q) =>
                                              q.questionId ==
                                              question.questionId
                                                ? { ...q, answers: [v] }
                                                : q
                                            ),
                                        }
                                      : activity
                                  )
                                )
                              }
                            >
                              <SelectTrigger
                                className={cn(
                                  "w-full",
                                  ((question.answers
                                    ? question.answers[0]
                                    : "") == "" &&
                                    question.required) ||
                                    !isValid(
                                      question.answers?.[0] ?? "",
                                      question.dataFormat
                                    )
                                    ? "border border-destructive"
                                    : ""
                                )}
                              >
                                <SelectValue
                                  placeholder={
                                    question.placeholder ?? t("choose-one")
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {question.answerOptions.map((option) => {
                                  if (option.value && option.label)
                                    return (
                                      <SelectItem
                                        value={option.value}
                                        key={option.value}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      }
                      if (
                        question.dataType == "CHECKBOX_TOGGLE" ||
                        question.dataType == "BOOLEAN"
                      ) {
                        return (
                          <div
                            key={question.questionId}
                            className="w-full flex flex-row gap-1 items-center"
                          >
                            <Checkbox
                              checked={
                                (question.answers
                                  ? question.answers[0]
                                  : "no") != "no"
                              }
                              onCheckedChange={(c) => {
                                setActivityBookings((prev) =>
                                  prev.map((activity, indx) =>
                                    indx == step
                                      ? {
                                          ...activity,
                                          pickupQuestions:
                                            activity.pickupQuestions.map((q) =>
                                              q.questionId ==
                                              question.questionId
                                                ? {
                                                    ...q,
                                                    answers: [c ? "yes" : "no"],
                                                  }
                                                : q
                                            ),
                                        }
                                      : activity
                                  )
                                );
                              }}
                            />
                            <Label className="text-sm font-normal">
                              {question.label}
                              {question.required && (
                                <span className="text-xs text-destructive">
                                  *
                                </span>
                              )}
                            </Label>
                          </div>
                        );
                      }
                      if (question.dataType == "DATE") {
                        return (
                          <div
                            key={question.questionId}
                            className="w-full flex flex-col gap-1 items-start"
                          >
                            <Label className="text-sm font-normal">
                              {question.label}
                              {question.required && (
                                <span className="text-xs text-destructive">
                                  *
                                </span>
                              )}
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  data-empty={
                                    (question.answers
                                      ? question.answers[0]
                                      : "") == ""
                                  }
                                  className={
                                    "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal data-[empty=true]:border data-[empty=true]:border-destructive"
                                  }
                                >
                                  <CalendarIcon />
                                  {(question.answers
                                    ? question.answers[0]
                                    : "") != "" ? (
                                    format(question.answers[0], "PPP")
                                  ) : (
                                    <span>{t("select-date")}</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  defaultMonth={
                                    question.answers
                                      ? parse(
                                          question.answers[0],
                                          "yyyy-MM-dd",
                                          new Date()
                                        )
                                      : undefined
                                  }
                                  disabled={(d) => d > new Date()}
                                  captionLayout="dropdown"
                                  showOutsideDays={false}
                                  mode="single"
                                  selected={
                                    question.answers
                                      ? parse(
                                          question.answers[0],
                                          "yyyy-MM-dd",
                                          new Date()
                                        )
                                      : undefined
                                  }
                                  onSelect={(date) => {
                                    if (!date) {
                                      setActivityBookings((prev) =>
                                        prev.map((activity, indx) =>
                                          indx == step
                                            ? {
                                                ...activity,
                                                pickupQuestions:
                                                  activity.pickupQuestions.map(
                                                    (q) =>
                                                      q.questionId ==
                                                      question.questionId
                                                        ? {
                                                            ...q,
                                                            answers: [""],
                                                          }
                                                        : q
                                                  ),
                                              }
                                            : activity
                                        )
                                      );
                                    } else {
                                      setActivityBookings((prev) =>
                                        prev.map((activity, indx) =>
                                          indx == step
                                            ? {
                                                ...activity,
                                                pickupQuestions:
                                                  activity.pickupQuestions.map(
                                                    (q) =>
                                                      q.questionId ==
                                                      question.questionId
                                                        ? {
                                                            ...q,
                                                            answers: [
                                                              format(
                                                                date,
                                                                "yyyy-MM-dd"
                                                              ),
                                                            ],
                                                          }
                                                        : q
                                                  ),
                                              }
                                            : activity
                                        )
                                      );
                                    }
                                    document
                                      .querySelector<HTMLButtonElement>(
                                        `[data-popover-close="${question.questionId}"]`
                                      )
                                      ?.click();
                                  }}
                                />
                                <PopoverClose asChild>
                                  <button
                                    type="button"
                                    hidden
                                    data-popover-close={question.questionId}
                                  />
                                </PopoverClose>
                              </PopoverContent>
                            </Popover>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={question.questionId}
                          className="w-full flex flex-col gap-1 items-start"
                        >
                          <Label className="text-sm font-normal">
                            {question.label}
                            {question.required && (
                              <span className="text-xs text-destructive">
                                *
                              </span>
                            )}
                          </Label>
                          <Input
                            value={question.answers ? question.answers[0] : ""}
                            onChange={(e) => {
                              setActivityBookings((prev) =>
                                prev.map((activity, indx) =>
                                  indx == step
                                    ? {
                                        ...activity,
                                        pickupQuestions:
                                          activity.pickupQuestions.map((q) =>
                                            q.questionId == question.questionId
                                              ? {
                                                  ...q,
                                                  answers: [e.target.value],
                                                }
                                              : q
                                          ),
                                      }
                                    : activity
                                )
                              );
                            }}
                            className={cn(
                              "w-full",
                              ((question.answers ? question.answers[0] : "") ==
                                "" &&
                                question.required) ||
                                !isValid(
                                  question.answers?.[0] ?? "",
                                  question.dataFormat
                                )
                                ? "border border-destructive"
                                : ""
                            )}
                          />
                        </div>
                      );
                    })}
                </div>
              )}
              {step == 0 &&
                mainContactDetails?.filter(
                  (question) =>
                    !["firstName", "lastName", "email", "phoneNumber"].includes(
                      question.questionId
                    )
                )?.length > 0 && (
                  <div className="w-full flex flex-col gap-2 items-start">
                    <p className="w-fit max-w-full pr-4 border-b-2 border-primary text-base font-semibold">
                      {t("additional-contact-information")}
                    </p>
                    {mainContactDetails
                      .filter(
                        (question) =>
                          ![
                            "firstName",
                            "lastName",
                            "email",
                            "phoneNumber",
                          ].includes(question.questionId)
                      )
                      .map((question) => {
                        if (
                          question.dataType == "OPTIONS" ||
                          question.selectFromOptions
                        ) {
                          return (
                            <div
                              key={question.questionId}
                              className="w-full flex flex-col gap-1 items-start"
                            >
                              <Label className="text-sm font-normal">
                                {question.label}
                                {question.required && (
                                  <span className="text-xs text-destructive">
                                    *
                                  </span>
                                )}
                              </Label>
                              <Select
                                defaultValue={
                                  question.defaultValue ?? undefined
                                }
                                value={
                                  question.answers ? question.answers[0] : ""
                                }
                                onValueChange={(v) =>
                                  setMainContactDetails((prev) =>
                                    prev.map((q) =>
                                      q.questionId == question.questionId
                                        ? { ...q, answers: [v] }
                                        : q
                                    )
                                  )
                                }
                              >
                                <SelectTrigger
                                  className={cn(
                                    "w-full",
                                    ((question.answers
                                      ? question.answers[0]
                                      : "") == "" &&
                                      question.required) ||
                                      !isValid(
                                        question.answers?.[0] ?? "",
                                        question.dataFormat
                                      )
                                      ? "border border-destructive"
                                      : ""
                                  )}
                                >
                                  <SelectValue
                                    placeholder={
                                      question.placeholder ?? t("choose-one")
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {question.answerOptions.map((option) => {
                                    if (option.value && option.label)
                                      return (
                                        <SelectItem
                                          value={option.value}
                                          key={option.value}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }
                        if (
                          question.dataType == "CHECKBOX_TOGGLE" ||
                          question.dataType == "BOOLEAN"
                        ) {
                          return (
                            <div
                              key={question.questionId}
                              className="w-full flex flex-row gap-1 items-center"
                            >
                              <Checkbox
                                checked={
                                  (question.answers
                                    ? question.answers[0]
                                    : "no") != "no"
                                }
                                onCheckedChange={(c) => {
                                  setMainContactDetails((prev) =>
                                    prev.map((q) =>
                                      q.questionId == question.questionId
                                        ? { ...q, answers: [c ? "yes" : "no"] }
                                        : q
                                    )
                                  );
                                }}
                              />
                              <Label className="text-sm font-normal">
                                {question.label}
                                {question.required && (
                                  <span className="text-xs text-destructive">
                                    *
                                  </span>
                                )}
                              </Label>
                            </div>
                          );
                        }
                        if (question.dataType == "DATE") {
                          return (
                            <div
                              key={question.questionId}
                              className="w-full flex flex-col gap-1 items-start"
                            >
                              <Label className="text-sm font-normal">
                                {question.label}
                                {question.required && (
                                  <span className="text-xs text-destructive">
                                    *
                                  </span>
                                )}
                              </Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    data-empty={
                                      (question.answers
                                        ? question.answers[0]
                                        : "") == ""
                                    }
                                    className={
                                      "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal data-[empty=true]:border data-[empty=true]:border-destructive"
                                    }
                                  >
                                    <CalendarIcon />
                                    {(question.answers
                                      ? question.answers[0]
                                      : "") != "" ? (
                                      format(question.answers[0], "PPP")
                                    ) : (
                                      <span>{t("select-date")}</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    defaultMonth={
                                      question.answers
                                        ? parse(
                                            question.answers[0],
                                            "yyyy-MM-dd",
                                            new Date()
                                          )
                                        : undefined
                                    }
                                    disabled={(d) => d > new Date()}
                                    captionLayout="dropdown"
                                    showOutsideDays={false}
                                    mode="single"
                                    selected={
                                      question.answers
                                        ? parse(
                                            question.answers[0],
                                            "yyyy-MM-dd",
                                            new Date()
                                          )
                                        : undefined
                                    }
                                    onSelect={(date) => {
                                      if (!date) {
                                        setMainContactDetails((prev) =>
                                          prev.map((q) =>
                                            q.questionId == question.questionId
                                              ? { ...q, answers: [""] }
                                              : q
                                          )
                                        );
                                      } else {
                                        setMainContactDetails((prev) =>
                                          prev.map((q) =>
                                            q.questionId == question.questionId
                                              ? {
                                                  ...q,
                                                  answers: [
                                                    format(date, "yyyy-MM-dd"),
                                                  ],
                                                }
                                              : q
                                          )
                                        );
                                      }
                                      document
                                        .querySelector<HTMLButtonElement>(
                                          `[data-popover-close="${question.questionId}"]`
                                        )
                                        ?.click();
                                    }}
                                  />
                                  <PopoverClose asChild>
                                    <button
                                      type="button"
                                      hidden
                                      data-popover-close={question.questionId}
                                    />
                                  </PopoverClose>
                                </PopoverContent>
                              </Popover>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={question.questionId}
                            className="w-full flex flex-col gap-1 items-start"
                          >
                            <Label className="text-sm font-normal">
                              {question.label}
                              {question.required && (
                                <span className="text-xs text-destructive">
                                  *
                                </span>
                              )}
                            </Label>
                            <Input
                              value={
                                question.answers ? question.answers[0] : ""
                              }
                              onChange={(e) => {
                                setMainContactDetails((prev) =>
                                  prev.map((q) =>
                                    q.questionId == question.questionId
                                      ? { ...q, answers: [e.target.value] }
                                      : q
                                  )
                                );
                              }}
                              className={cn(
                                "w-full",
                                ((question.answers
                                  ? question.answers[0]
                                  : "") == "" &&
                                  question.required) ||
                                  !isValid(
                                    question.answers?.[0] ?? "",
                                    question.dataFormat
                                  )
                                  ? "border border-destructive"
                                  : ""
                              )}
                            />
                          </div>
                        );
                      })}
                  </div>
                )}
              {activityBookings[step].passengers.length > 0 && (
                <Carousel className="w-full mx-auto border shadow p-2 rounded-lg">
                  <CarouselContent className="p-0">
                    {activityBookings[step].passengers.map(
                      (passenger, pIndx) => {
                        return (
                          <CarouselItem
                            key={passenger.bookingId}
                            className="w-full flex flex-col gap-2 items-start mx-auto"
                          >
                            <p className="w-fit max-w-full pr-4 border-b-2 border-primary text-base font-semibold">
                              {t("traveler-info", {
                                count: pIndx + 1,
                                category: displayT(
                                  categoriesMap[passenger.pricingCategoryId]
                                    .title
                                ),
                              })}
                            </p>
                            {passenger.passengerDetails.map((question) => {
                              if (
                                question.dataType == "OPTIONS" ||
                                question.selectFromOptions
                              ) {
                                return (
                                  <div
                                    key={question.questionId}
                                    className="w-full flex flex-col gap-1 items-start"
                                  >
                                    <Label className="text-sm font-normal">
                                      {question.label}
                                      {question.required && (
                                        <span className="text-xs text-destructive">
                                          *
                                        </span>
                                      )}
                                    </Label>
                                    <Select
                                      defaultValue={
                                        question.defaultValue ?? undefined
                                      }
                                      value={
                                        question.answers
                                          ? question.answers[0]
                                          : ""
                                      }
                                      onValueChange={(v) =>
                                        setActivityBookings((prev) =>
                                          prev.map((activity, i) =>
                                            i == step
                                              ? {
                                                  ...activity,
                                                  passengers:
                                                    activity.passengers.map(
                                                      (passenger, pI) =>
                                                        pI == pIndx
                                                          ? {
                                                              ...passenger,
                                                              passengerDetails:
                                                                passenger.passengerDetails.map(
                                                                  (pQuestion) =>
                                                                    pQuestion.questionId ==
                                                                    question.questionId
                                                                      ? {
                                                                          ...pQuestion,
                                                                          answers:
                                                                            [v],
                                                                        }
                                                                      : pQuestion
                                                                ),
                                                            }
                                                          : passenger
                                                    ),
                                                }
                                              : activity
                                          )
                                        )
                                      }
                                    >
                                      <SelectTrigger
                                        className={cn(
                                          "w-full",
                                          ((question.answers
                                            ? question.answers[0]
                                            : "") == "" &&
                                            question.required) ||
                                            !isValid(
                                              question.answers?.[0] ?? "",
                                              question.dataFormat
                                            )
                                            ? "border border-destructive"
                                            : ""
                                        )}
                                      >
                                        <SelectValue
                                          placeholder={
                                            question.placeholder ??
                                            t("choose-one")
                                          }
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {question.answerOptions.map(
                                          (option) => {
                                            if (option.value && option.label)
                                              return (
                                                <SelectItem
                                                  value={option.value}
                                                  key={option.value}
                                                >
                                                  {option.label}
                                                </SelectItem>
                                              );
                                          }
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              }
                              if (
                                question.dataType == "CHECKBOX_TOGGLE" ||
                                question.dataType == "BOOLEAN"
                              ) {
                                return (
                                  <div
                                    key={question.questionId}
                                    className="w-full flex flex-row gap-1 items-center"
                                  >
                                    <Checkbox
                                      checked={
                                        (question.answers
                                          ? question.answers[0]
                                          : "no") != "no"
                                      }
                                      onCheckedChange={(c) => {
                                        setActivityBookings((prev) =>
                                          prev.map((activity, i) =>
                                            i == step
                                              ? {
                                                  ...activity,
                                                  passengers:
                                                    activity.passengers.map(
                                                      (passenger, pI) =>
                                                        pI == pIndx
                                                          ? {
                                                              ...passenger,
                                                              passengerDetails:
                                                                passenger.passengerDetails.map(
                                                                  (pQuestion) =>
                                                                    pQuestion.questionId ==
                                                                    question.questionId
                                                                      ? {
                                                                          ...pQuestion,
                                                                          answers:
                                                                            [
                                                                              c
                                                                                ? "yes"
                                                                                : "no",
                                                                            ],
                                                                        }
                                                                      : pQuestion
                                                                ),
                                                            }
                                                          : passenger
                                                    ),
                                                }
                                              : activity
                                          )
                                        );
                                      }}
                                    />
                                    <Label className="text-sm font-normal">
                                      {question.label}
                                      {question.required && (
                                        <span className="text-xs text-destructive">
                                          *
                                        </span>
                                      )}
                                    </Label>
                                  </div>
                                );
                              }
                              if (question.dataType == "DATE") {
                                return (
                                  <div
                                    key={question.questionId}
                                    className="w-full flex flex-col gap-1 items-start"
                                  >
                                    <Label className="text-sm font-normal">
                                      {question.label}
                                      {question.required && (
                                        <span className="text-xs text-destructive">
                                          *
                                        </span>
                                      )}
                                    </Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          data-empty={
                                            (question.answers
                                              ? question.answers[0]
                                              : "") == ""
                                          }
                                          className={
                                            "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal data-[empty=true]:border data-[empty=true]:border-destructive"
                                          }
                                        >
                                          <CalendarIcon />
                                          {(question.answers
                                            ? question.answers[0]
                                            : "") != "" ? (
                                            format(question.answers[0], "PPP")
                                          ) : (
                                            <span>{t("select-date")}</span>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <Calendar
                                          defaultMonth={
                                            question.answers
                                              ? parse(
                                                  question.answers[0],
                                                  "yyyy-MM-dd",
                                                  new Date()
                                                )
                                              : undefined
                                          }
                                          disabled={(d) => d > new Date()}
                                          captionLayout="dropdown"
                                          showOutsideDays={false}
                                          mode="single"
                                          selected={
                                            question.answers
                                              ? parse(
                                                  question.answers[0],
                                                  "yyyy-MM-dd",
                                                  new Date()
                                                )
                                              : undefined
                                          }
                                          onSelect={(date) => {
                                            if (!date) {
                                              setActivityBookings((prev) =>
                                                prev.map((activity, i) =>
                                                  i == step
                                                    ? {
                                                        ...activity,
                                                        passengers:
                                                          activity.passengers.map(
                                                            (passenger, pI) =>
                                                              pI == pIndx
                                                                ? {
                                                                    ...passenger,
                                                                    passengerDetails:
                                                                      passenger.passengerDetails.map(
                                                                        (
                                                                          pQuestion
                                                                        ) =>
                                                                          pQuestion.questionId ==
                                                                          question.questionId
                                                                            ? {
                                                                                ...pQuestion,
                                                                                answers:
                                                                                  [
                                                                                    "",
                                                                                  ],
                                                                              }
                                                                            : pQuestion
                                                                      ),
                                                                  }
                                                                : passenger
                                                          ),
                                                      }
                                                    : activity
                                                )
                                              );
                                            } else {
                                              setActivityBookings((prev) =>
                                                prev.map((activity, i) =>
                                                  i == step
                                                    ? {
                                                        ...activity,
                                                        passengers:
                                                          activity.passengers.map(
                                                            (passenger, pI) =>
                                                              pI == pIndx
                                                                ? {
                                                                    ...passenger,
                                                                    passengerDetails:
                                                                      passenger.passengerDetails.map(
                                                                        (
                                                                          pQuestion
                                                                        ) =>
                                                                          pQuestion.questionId ==
                                                                          question.questionId
                                                                            ? {
                                                                                ...pQuestion,
                                                                                answers:
                                                                                  [
                                                                                    format(
                                                                                      date,
                                                                                      "yyyy-MM-dd"
                                                                                    ),
                                                                                  ],
                                                                              }
                                                                            : pQuestion
                                                                      ),
                                                                  }
                                                                : passenger
                                                          ),
                                                      }
                                                    : activity
                                                )
                                              );
                                            }
                                            document
                                              .querySelector<HTMLButtonElement>(
                                                `[data-popover-close="${question.questionId}"]`
                                              )
                                              ?.click();
                                          }}
                                        />
                                        <PopoverClose asChild>
                                          <button
                                            type="button"
                                            hidden
                                            data-popover-close={
                                              question.questionId
                                            }
                                          />
                                        </PopoverClose>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                );
                              }
                              return (
                                <div
                                  key={question.questionId}
                                  className="w-full flex flex-col gap-1 items-start"
                                >
                                  <Label className="text-sm font-normal">
                                    {question.label}
                                    {question.required && (
                                      <span className="text-xs text-destructive">
                                        *
                                      </span>
                                    )}
                                  </Label>
                                  <Input
                                    value={
                                      question.answers
                                        ? question.answers[0]
                                        : ""
                                    }
                                    onChange={(e) => {
                                      setActivityBookings((prev) =>
                                        prev.map((activity, i) =>
                                          i == step
                                            ? {
                                                ...activity,
                                                passengers:
                                                  activity.passengers.map(
                                                    (passenger, pI) =>
                                                      pI == pIndx
                                                        ? {
                                                            ...passenger,
                                                            passengerDetails:
                                                              passenger.passengerDetails.map(
                                                                (pQuestion) =>
                                                                  pQuestion.questionId ==
                                                                  question.questionId
                                                                    ? {
                                                                        ...pQuestion,
                                                                        answers:
                                                                          [
                                                                            e
                                                                              .target
                                                                              .value,
                                                                          ],
                                                                      }
                                                                    : pQuestion
                                                              ),
                                                          }
                                                        : passenger
                                                  ),
                                              }
                                            : activity
                                        )
                                      );
                                    }}
                                    className={cn(
                                      "w-full",
                                      ((question.answers
                                        ? question.answers[0]
                                        : "") == "" &&
                                        question.required) ||
                                        !isValid(
                                          question.answers?.[0] ?? "",
                                          question.dataFormat
                                        )
                                        ? "border border-destructive"
                                        : ""
                                    )}
                                  />
                                </div>
                              );
                            })}
                            {passenger.questions.map((question) => {
                              if (
                                question.dataType == "OPTIONS" ||
                                question.selectFromOptions
                              ) {
                                return (
                                  <div
                                    key={question.questionId}
                                    className="w-full flex flex-col gap-1 items-start"
                                  >
                                    <Label className="text-sm font-normal">
                                      {question.label}
                                      {question.required && (
                                        <span className="text-xs text-destructive">
                                          *
                                        </span>
                                      )}
                                    </Label>
                                    <Select
                                      defaultValue={
                                        question.defaultValue ?? undefined
                                      }
                                      value={
                                        question.answers
                                          ? question.answers[0]
                                          : ""
                                      }
                                      onValueChange={(v) =>
                                        setActivityBookings((prev) =>
                                          prev.map((activity, i) =>
                                            i == step
                                              ? {
                                                  ...activity,
                                                  passengers:
                                                    activity.passengers.map(
                                                      (passenger, pI) =>
                                                        pI == pIndx
                                                          ? {
                                                              ...passenger,
                                                              questions:
                                                                passenger.questions.map(
                                                                  (pQuestion) =>
                                                                    pQuestion.questionId ==
                                                                    question.questionId
                                                                      ? {
                                                                          ...pQuestion,
                                                                          answers:
                                                                            [v],
                                                                        }
                                                                      : pQuestion
                                                                ),
                                                            }
                                                          : passenger
                                                    ),
                                                }
                                              : activity
                                          )
                                        )
                                      }
                                    >
                                      <SelectTrigger
                                        className={cn(
                                          "w-full",
                                          ((question.answers
                                            ? question.answers[0]
                                            : "") == "" &&
                                            question.required) ||
                                            !isValid(
                                              question.answers?.[0] ?? "",
                                              question.dataFormat
                                            )
                                            ? "border border-destructive"
                                            : ""
                                        )}
                                      >
                                        <SelectValue
                                          placeholder={
                                            question.placeholder ??
                                            t("choose-one")
                                          }
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {question.answerOptions.map(
                                          (option) => {
                                            if (option.value && option.label)
                                              return (
                                                <SelectItem
                                                  value={option.value}
                                                  key={option.value}
                                                >
                                                  {option.label}
                                                </SelectItem>
                                              );
                                          }
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              }
                              if (
                                question.dataType == "CHECKBOX_TOGGLE" ||
                                question.dataType == "BOOLEAN"
                              ) {
                                return (
                                  <div
                                    key={question.questionId}
                                    className="w-full flex flex-row gap-1 items-center"
                                  >
                                    <Checkbox
                                      checked={
                                        (question.answers
                                          ? question.answers[0]
                                          : "no") != "no"
                                      }
                                      onCheckedChange={(c) => {
                                        setActivityBookings((prev) =>
                                          prev.map((activity, i) =>
                                            i == step
                                              ? {
                                                  ...activity,
                                                  passengers:
                                                    activity.passengers.map(
                                                      (passenger, pI) =>
                                                        pI == pIndx
                                                          ? {
                                                              ...passenger,
                                                              questions:
                                                                passenger.questions.map(
                                                                  (pQuestion) =>
                                                                    pQuestion.questionId ==
                                                                    question.questionId
                                                                      ? {
                                                                          ...pQuestion,
                                                                          answers:
                                                                            [
                                                                              c
                                                                                ? "yes"
                                                                                : "no",
                                                                            ],
                                                                        }
                                                                      : pQuestion
                                                                ),
                                                            }
                                                          : passenger
                                                    ),
                                                }
                                              : activity
                                          )
                                        );
                                      }}
                                    />
                                    <Label className="text-sm font-normal">
                                      {question.label}
                                      {question.required && (
                                        <span className="text-xs text-destructive">
                                          *
                                        </span>
                                      )}
                                    </Label>
                                  </div>
                                );
                              }
                              if (question.dataType == "DATE") {
                                return (
                                  <div
                                    key={question.questionId}
                                    className="w-full flex flex-col gap-1 items-start"
                                  >
                                    <Label className="text-sm font-normal">
                                      {question.label}
                                      {question.required && (
                                        <span className="text-xs text-destructive">
                                          *
                                        </span>
                                      )}
                                    </Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          data-empty={
                                            (question.answers
                                              ? question.answers[0]
                                              : "") == ""
                                          }
                                          className={
                                            "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal data-[empty=true]:border data-[empty=true]:border-destructive"
                                          }
                                        >
                                          <CalendarIcon />
                                          {(question.answers
                                            ? question.answers[0]
                                            : "") != "" ? (
                                            format(question.answers[0], "PPP")
                                          ) : (
                                            <span>{t("select-date")}</span>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <Calendar
                                          defaultMonth={
                                            question.answers
                                              ? parse(
                                                  question.answers[0],
                                                  "yyyy-MM-dd",
                                                  new Date()
                                                )
                                              : undefined
                                          }
                                          disabled={(d) => d > new Date()}
                                          captionLayout="dropdown"
                                          showOutsideDays={false}
                                          mode="single"
                                          selected={
                                            question.answers
                                              ? parse(
                                                  question.answers[0],
                                                  "yyyy-MM-dd",
                                                  new Date()
                                                )
                                              : undefined
                                          }
                                          onSelect={(date) => {
                                            if (!date) {
                                              setActivityBookings((prev) =>
                                                prev.map((activity, i) =>
                                                  i == step
                                                    ? {
                                                        ...activity,
                                                        passengers:
                                                          activity.passengers.map(
                                                            (passenger, pI) =>
                                                              pI == pIndx
                                                                ? {
                                                                    ...passenger,
                                                                    questions:
                                                                      passenger.questions.map(
                                                                        (
                                                                          pQuestion
                                                                        ) =>
                                                                          pQuestion.questionId ==
                                                                          question.questionId
                                                                            ? {
                                                                                ...pQuestion,
                                                                                answers:
                                                                                  [
                                                                                    "",
                                                                                  ],
                                                                              }
                                                                            : pQuestion
                                                                      ),
                                                                  }
                                                                : passenger
                                                          ),
                                                      }
                                                    : activity
                                                )
                                              );
                                            } else {
                                              setActivityBookings((prev) =>
                                                prev.map((activity, i) =>
                                                  i == step
                                                    ? {
                                                        ...activity,
                                                        passengers:
                                                          activity.passengers.map(
                                                            (passenger, pI) =>
                                                              pI == pIndx
                                                                ? {
                                                                    ...passenger,
                                                                    questions:
                                                                      passenger.questions.map(
                                                                        (
                                                                          pQuestion
                                                                        ) =>
                                                                          pQuestion.questionId ==
                                                                          question.questionId
                                                                            ? {
                                                                                ...pQuestion,
                                                                                answers:
                                                                                  [
                                                                                    format(
                                                                                      date,
                                                                                      "yyyy-MM-dd"
                                                                                    ),
                                                                                  ],
                                                                              }
                                                                            : pQuestion
                                                                      ),
                                                                  }
                                                                : passenger
                                                          ),
                                                      }
                                                    : activity
                                                )
                                              );
                                            }
                                            document
                                              .querySelector<HTMLButtonElement>(
                                                `[data-popover-close="${question.questionId}"]`
                                              )
                                              ?.click();
                                          }}
                                        />
                                        <PopoverClose asChild>
                                          <button
                                            type="button"
                                            hidden
                                            data-popover-close={
                                              question.questionId
                                            }
                                          />
                                        </PopoverClose>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                );
                              }
                              return (
                                <div
                                  key={question.questionId}
                                  className="w-full flex flex-col gap-1 items-start"
                                >
                                  <Label className="text-sm font-normal">
                                    {question.label}
                                    {question.required && (
                                      <span className="text-xs text-destructive">
                                        *
                                      </span>
                                    )}
                                  </Label>
                                  <Input
                                    value={
                                      question.answers
                                        ? question.answers[0]
                                        : ""
                                    }
                                    onChange={(e) => {
                                      setActivityBookings((prev) =>
                                        prev.map((activity, i) =>
                                          i == step
                                            ? {
                                                ...activity,
                                                passengers:
                                                  activity.passengers.map(
                                                    (passenger, pI) =>
                                                      pI == pIndx
                                                        ? {
                                                            ...passenger,
                                                            questions:
                                                              passenger.questions.map(
                                                                (pQuestion) =>
                                                                  pQuestion.questionId ==
                                                                  question.questionId
                                                                    ? {
                                                                        ...pQuestion,
                                                                        answers:
                                                                          [
                                                                            e
                                                                              .target
                                                                              .value,
                                                                          ],
                                                                      }
                                                                    : pQuestion
                                                              ),
                                                          }
                                                        : passenger
                                                  ),
                                              }
                                            : activity
                                        )
                                      );
                                    }}
                                    className={cn(
                                      "w-full",
                                      ((question.answers
                                        ? question.answers[0]
                                        : "") == "" &&
                                        question.required) ||
                                        !isValid(
                                          question.answers?.[0] ?? "",
                                          question.dataFormat
                                        )
                                        ? "border border-destructive"
                                        : ""
                                    )}
                                  />
                                </div>
                              );
                            })}
                          </CarouselItem>
                        );
                      }
                    )}
                  </CarouselContent>
                  {activityBookings[step].passengers.length > 1 && (
                    <div className="absolute top-0 right-0">
                      <CarouselPrevious className="border-none p-0 right-0 top-4 shadow-none w-fit h-fit" />
                      <CarouselNext className="border-none p-0 right-2 top-4 shadow-none w-fit h-fit" />
                    </div>
                  )}
                </Carousel>
              )}
              <Button
                type="button"
                onClick={() => {
                  setMainContactDetails((prev) =>
                    prev.map((question) =>
                      [
                        "firstName",
                        "lastName",
                        "email",
                        "phoneNumber",
                      ].includes(question.questionId)
                        ? {
                            ...question,
                            answers:
                              question.questionId == "firstName"
                                ? [addressData?.firstName ?? ""]
                                : question.questionId == "lastName"
                                ? [addressData?.lastName ?? ""]
                                : question.questionId == "email"
                                ? [clientInfo.getValues("email") ?? ""]
                                : [addressData?.phone ?? ""],
                          }
                        : question
                    )
                  );

                  setStep((prev) =>
                    typeof prev == "number"
                      ? prev ==
                        cart.filter((item) => item.type == "activity").length -
                          1
                        ? "paying"
                        : prev + 1
                      : prev
                  );
                }}
                disabled={
                  mainContactDetails
                    .filter(
                      (question) =>
                        ![
                          "firstName",
                          "lastName",
                          "email",
                          "phoneNumber",
                        ].includes(question.questionId)
                    )
                    .some(
                      (question) =>
                        question.required &&
                        (question.answers ? question.answers[0] : "") == ""
                    ) ||
                  activityBookings[step].passengers.some((passenger) =>
                    passenger.passengerDetails.some(
                      (question) =>
                        question.required &&
                        (question.answers ? question.answers[0] : "") == ""
                    )
                  ) ||
                  activityBookings[step].passengers.some((passenger) =>
                    passenger.questions.some(
                      (question) =>
                        question.required &&
                        (question.answers ? question.answers[0] : "") == ""
                    )
                  ) ||
                  activityBookings[step]?.questions.some(
                    (question) =>
                      question.required &&
                      (question.answers ? question.answers[0] : "") == ""
                  ) ||
                  activityBookings[step]?.pickupQuestions.some(
                    (question) =>
                      question.required &&
                      (question.answers ? question.answers[0] : "") == ""
                  )
                }
                className="w-full"
              >
                {step ==
                cart.filter((item) => item.type == "activity").length - 1
                  ? t("proceed-payment")
                  : t("continue")}{" "}
                <ArrowRight />
              </Button>
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
                    <Image unoptimized src={cardSvg} alt="Card-icon" />
                    {t("card")}
                  </TabsTrigger>
                  <TabsTrigger value="sepa" className="px-4">
                    <Image unoptimized src={sepaSvg} alt="Sepa-icon" />
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
