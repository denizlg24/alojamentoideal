"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@radix-ui/react-separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useStripe,
  useElements,
  AddressElement,
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  IbanElement,
} from "@stripe/react-stripe-js";
import { checkVAT, countries } from "jsvat";
import { ArrowRight, CalendarIcon, Edit3, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
//import { FaApplePay } from "react-icons/fa6";
import { Country } from "react-phone-number-input";
import z from "zod";
import Image from "next/image";
import cardSvg from "@/public/stripe-card.svg";
import sepaSvg from "@/public/stripe-sepa.svg";
import { Appearance } from "@stripe/stripe-js";
import flags from "react-phone-number-input/flags";
import {
  ActivityBookingQuestionsDto,
  categoriesMap,
  ContactInformationDto,
  ExperienceBookingQuestionDto,
  isValid,
  PickupPlaceDto,
  QuestionSpecificationDto,
} from "@/utils/bokun-requests";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import {
  createBookingRequest,
  getShoppingCartQuestion,
  removeActivity,
  startShoppingCart,
} from "@/app/actions/getExperience";
import { Label } from "@/components/ui/label";
import { PopoverClose } from "@radix-ui/react-popover";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
//import { startShoppingCart } from "@/app/actions/getExperience";
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

export const FlagComponent = ({
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

export const TourCheckoutForm = ({
  initialCountry = "PT",
  cartId,
  meeting,
  rateId,
  guests,
  selectedStartTimeId,
  experienceId,
  selectedDate,
}: {
  initialCountry: string;
  cartId: string;
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
  selectedDate: string;
  selectedStartTimeId: number | undefined;
  guests: { [categoryId: number]: number };
}) => {
  const displayT = useTranslations("tourDisplay");
  const t = useTranslations("checkout_form");

  const stripe = useStripe();
  const elements = useElements();
  elements?.update({ appearance: elementStyle });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [_amount, setAmount] = useState(0);
  const [priceLoading, setPriceLoading] = useState(true);
  //const [checking, setChecking] = useState(true);
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
  const [step, setStep] = useState<
    "client_info" | "booking_questions" | "paying"
  >("client_info");

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

  const router = useRouter();

  const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
    setLoading(true);
    if (!addressData) {
      setLoading(false);
      setError("provide_information");
      return;
    }
    setLoadingMessage("loading_create_res");
    const response = await createBookingRequest({
      mainContactDetails: mainContactDetails.map((question) => ({
        questionId: question.questionId,
        values: question.answers ?? [],
      })),
      activityBookings: activityBookings.map((activity) => ({
        activityId: activity.activityId,
        answers: activity.questions?.map((question) => ({
          questionId: question.questionId,
          values: question.answers ?? [],
        })),
        pickupAnswers: activity.pickupQuestions?.map((question) => ({
          questionId: question.questionId,
          values: question.answers ?? [],
        })),
        pickup: selectedPickupPlaceId == "custom" ? false : true,
        pickupPlaceId:
          selectedPickupPlaceId == "custom" ? undefined : selectedPickupPlaceId,
        rateId: rateId,
        startTimeId: selectedStartTimeId,
        date: format(selectedDate, "yyyy-MM-dd"),
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
      checkoutOptionAnswers: [],
      clientName:
        addressData.name ?? addressData.firstName + " " + addressData.lastName,
      clientEmail: data.email,
      clientPhone: addressData.phone ?? "",
      clientAddress: addressData.address,
      isCompany: needCompanySwitch,
      selectedRateId: [rateId],
      guests: [guests],
      selectedStartTimeId: [selectedStartTimeId ?? 0],
      clientNotes: data.note,
      clientTax: data.vat,
      companyName: data.business_name,
    });
    if (!response) {
      setError("error_reservation");
      setLoading(false);
      return;
    }
    const { success, client_secret, payment_id, order_id } = response;
    if (!success || !client_secret || !payment_id) {
      setError("error_reservation");
      setLoading(false);
      return;
    }
    setLoadingMessage("loading_process_pay");
    if (selectedTab == "card") {
      const cardNumberElement = elements?.getElement(CardNumberElement);
      if (!stripe || !cardNumberElement) throw new Error("Stripe not ready");
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name:
              addressData.name ??
              addressData.firstName + " " + addressData.lastName,
            email: data.email,
            phone: addressData.phone ?? "",
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
        setError("error_reservation");
        setLoading(false);
      }
    } else {
      const ibanNumberElement = elements?.getElement(IbanElement);
      if (!stripe || !ibanNumberElement) throw new Error("Stripe not ready");
      const result = await stripe.confirmSepaDebitPayment(client_secret, {
        payment_method: {
          sepa_debit: ibanNumberElement,
          billing_details: {
            name:
              addressData.name ??
              addressData.firstName + " " + addressData.lastName,
            email: data.email,
            phone: addressData.phone ?? "",
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
    setLoading(false);
  };
  const [mainContactDetails, setMainContactDetails] = useState<
    QuestionSpecificationDto[]
  >([]);
  const [activityBookings, setActivityBookings] = useState<
    ActivityBookingQuestionsDto[]
  >([]);
  const [selectedPickupPlaceId, setPickupPlaceId] = useState("custom");

  const [pickupQuestionsLoading, setPickupQuestionsLoading] = useState(false);

  const updateBookingPickUpQuestions = async (
    bookingId: number,
    activityId: number,
    pickupPlaceId: string | undefined
  ) => {
    const removed = await removeActivity(cartId, bookingId);
    if (removed) {
      await startShoppingCart(
        cartId,
        activityId,
        rateId,
        selectedStartTimeId,
        selectedDate,
        guests,
        pickupPlaceId
      );
      const response = await getShoppingCartQuestion(cartId);
      if (!response.success) {
        return;
      }
      const newBookingId = response.questions.activityBookings.find(
        (activity) => activity.activityId == activityId
      )?.bookingId;
      const newPickUpQuestion = response.questions.activityBookings.find(
        (activity) => activity.activityId == activityId
      )?.pickupQuestions;
      setActivityBookings((prev) =>
        prev.map((activity) =>
          activity.activityId == activityId
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
    const startShopping = async () => {
      const shopping = await startShoppingCart(
        cartId,
        experienceId,
        rateId,
        selectedStartTimeId,
        selectedDate,
        guests
      );
      if (!shopping.success) {
        setError("error-processing-request");
        return;
      }
      const response = await getShoppingCartQuestion(cartId);
      if (!response.success) {
        return;
      }
      const selectedOption = response.options.find(
        (option) => option.type === "CUSTOMER_FULL_PAYMENT"
      );
      setAmount((selectedOption?.amount ?? 0) * 100 || 0);
      setMainContactDetails(response.questions.mainContactDetails);
      setActivityBookings(response.questions.activityBookings);
      setPriceLoading(false);
    };
    if (
      cartId &&
      experienceId &&
      guests &&
      rateId &&
      selectedDate &&
      priceLoading
    ) {
      startShopping();
    }
  }, [
    cartId,
    experienceId,
    guests,
    priceLoading,
    rateId,
    selectedDate,
    selectedStartTimeId,
  ]);

  return (
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
                    defaultValues: {
                      address: {
                        country: initialCountry,
                      },
                    },
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
                  defaultValues: {
                    address: {
                      country: initialCountry,
                    },
                  },
                }}
              />
            )}
            <FormField
              control={clientInfo.control}
              name="vat"
              render={({ field }) => {
                const valueWithoutPrefix =
                  field.value?.replace(new RegExp(`^${vatCountryCode}`), "") ??
                  "";
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
                if (
                  mainContactDetails.length > 0 ||
                  activityBookings.length > 0
                ) {
                  setStep("booking_questions");
                } else {
                  setStep("paying");
                }
              }}
            >
              {t("continue")} <ArrowRight />
            </Button>
          </>
        )}

        {step == "booking_questions" && (
          <div className="w-full flex flex-col gap-4">
            {(activityBookings[0]?.questions?.length ?? 0) > 0 && (
              <div className="w-full flex flex-col gap-2 items-start">
                <p className="w-fit max-w-full pr-4 border-b-2 border-primary text-base font-semibold">
                  {t("booking-details")}
                </p>
                {activityBookings[0].questions?.map((question) => {
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
                            <span className="text-xs text-destructive">*</span>
                          )}
                        </Label>
                        <Select
                          defaultValue={question.defaultValue ?? undefined}
                          value={question.answers ? question.answers[0] : ""}
                          onValueChange={(v) =>
                            setActivityBookings((prev) =>
                              prev.map((activity, indx) =>
                                indx == 0
                                  ? {
                                      ...activity,
                                      questions: activity.questions?.map((q) =>
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
                                indx == 0
                                  ? {
                                      ...activity,
                                      questions: activity.questions?.map((q) =>
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
                            <span className="text-xs text-destructive">*</span>
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
                            <span className="text-xs text-destructive">*</span>
                          )}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              data-empty={
                                ((question.answers
                                  ? question.answers[0]
                                  : "") == "" &&
                                  question.required) ||
                                !isValid(
                                  question.answers ? question.answers[0] : "",
                                  question.dataFormat
                                )
                              }
                              className={
                                "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal data-[empty=true]:border data-[empty=true]:border-destructive"
                              }
                            >
                              <CalendarIcon />
                              {(question.answers ? question.answers[0] : "") !=
                              "" ? (
                                format(question.answers[0], "PPP")
                              ) : (
                                <span>{t("select-date")}</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              captionLayout="dropdown"
                              showOutsideDays={false}
                              mode="single"
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
                                      indx == 0
                                        ? {
                                            ...activity,
                                            questions: activity.questions?.map(
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
                                      indx == 0
                                        ? {
                                            ...activity,
                                            questions: activity.questions?.map(
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
                              indx == 0
                                ? {
                                    ...activity,
                                    questions: activity.questions?.map((q) =>
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
            {meeting.type != "MEET_ON_LOCATION" && (
              <div className="w-full flex flex-col gap-2 items-start">
                <p className="w-fit max-w-full pr-4 border-b-2 border-primary text-base font-semibold">
                  {t("pickup-details")}
                </p>
                <div className="w-full flex flex-col gap-1 items-start">
                  <Label className="text-sm font-normal">
                    {t("pickup-place")}
                  </Label>
                  <Select
                    disabled={pickupQuestionsLoading}
                    value={selectedPickupPlaceId}
                    onValueChange={async (v) => {
                      setPickupPlaceId(v);
                      setPickupQuestionsLoading(true);
                      await updateBookingPickUpQuestions(
                        activityBookings[0].bookingId,
                        experienceId,
                        v == "custom" ? undefined : v
                      );
                      setPickupQuestionsLoading(false);
                    }}
                  >
                    <SelectTrigger className={cn("w-full")}>
                      <SelectValue placeholder={t("choose-one")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"custom"}>
                        {t("i-want-to-select-my-own")}
                      </SelectItem>
                      {meeting.pickUpPlaces.map((option) => {
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
                {pickupQuestionsLoading && (
                  <Skeleton className="w-full h-[80px]" />
                )}
                {!pickupQuestionsLoading &&
                  activityBookings[0].pickupQuestions?.map((question) => {
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
                                  indx == 0
                                    ? {
                                        ...activity,
                                        questions: activity.questions?.map(
                                          (q) =>
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
                                  indx == 0
                                    ? {
                                        ...activity,
                                        pickupQuestions:
                                          activity.pickupQuestions?.map((q) =>
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
                                  ((question.answers
                                    ? question.answers[0]
                                    : "") == "" &&
                                    question.required) ||
                                  !isValid(
                                    question.answers ? question.answers[0] : "",
                                    question.dataFormat
                                  )
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
                                        indx == 0
                                          ? {
                                              ...activity,
                                              pickupQuestions:
                                                activity.pickupQuestions?.map(
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
                                        indx == 0
                                          ? {
                                              ...activity,
                                              pickupQuestions:
                                                activity.pickupQuestions?.map(
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
                    if (question.dataFormat == "TIME") {
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
                          <div className="flex flex-row items-center gap-1 w-full">
                            <Select
                              value={
                                question.answers
                                  ? (question.answers[0] ?? "") == ""
                                    ? ""
                                    : question.answers[0].split(":")[0]
                                  : ""
                              }
                              onValueChange={(val) => {
                                setActivityBookings((prev) =>
                                  prev.map((activity, indx) =>
                                    indx == 0
                                      ? {
                                          ...activity,
                                          pickupQuestions:
                                            activity.pickupQuestions?.map((q) =>
                                              q.questionId ==
                                              question.questionId
                                                ? {
                                                    ...q,
                                                    answers:
                                                      q.answers && q.answers[0]
                                                        ? [
                                                            `${val}:${
                                                              q.answers[0]?.split(
                                                                ":"
                                                              )[1] ?? "00"
                                                            }`,
                                                          ]
                                                        : [`${val}:00`],
                                                  }
                                                : q
                                            ),
                                        }
                                      : activity
                                  )
                                );
                              }}
                            >
                              <SelectTrigger
                                className={cn(
                                  "grow flex-1",
                                  (!question.answers ||
                                    ((question.answers[0] ?? "") == "")) &&
                                    question.required &&
                                    "border border-destructive"
                                )}
                              >
                                <SelectValue/>
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }).map((_, indx) => {
                                  return (
                                    <SelectItem
                                      key={indx}
                                      value={indx.toLocaleString(undefined, {
                                        minimumIntegerDigits: 2,
                                      })}
                                    >
                                      {indx.toLocaleString(undefined, {
                                        minimumIntegerDigits: 2,
                                      })}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <p className="text-sm font-semibold shrink-0">:</p>
                            <Select
                              value={
                                question.answers
                                  ? (question.answers[0] ?? "") == ""
                                    ? ""
                                    : question.answers[0].split(":")[1] ?? ""
                                  : ""
                              }
                              onValueChange={(val) => {
                                setActivityBookings((prev) =>
                                  prev.map((activity, indx) =>
                                    indx == 0
                                      ? {
                                          ...activity,
                                          pickupQuestions:
                                            activity.pickupQuestions?.map((q) =>
                                              q.questionId ==
                                              question.questionId
                                                ? {
                                                    ...q,
                                                    answers:
                                                      q.answers && q.answers[0]
                                                        ? [
                                                            `${
                                                              q.answers[0]?.split(
                                                                ":"
                                                              )[0] ?? "00"
                                                            }:${val}`,
                                                          ]
                                                        : [`00:${val}`],
                                                  }
                                                : q
                                            ),
                                        }
                                      : activity
                                  )
                                );
                              }}
                            >
                              <SelectTrigger
                                className={cn(
                                  "grow flex-1",
                                  (!question.answers ||
                                    ((question.answers[0] ?? "") == "")) &&
                                    question.required &&
                                    "border border-destructive"
                                )}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 60 }).map((_, indx) => {
                                  return (
                                    <SelectItem
                                      key={indx}
                                      value={indx.toLocaleString(undefined, {
                                        minimumIntegerDigits: 2,
                                      })}
                                    >
                                      {indx.toLocaleString(undefined, {
                                        minimumIntegerDigits: 2,
                                      })}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
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
                                indx == 0
                                  ? {
                                      ...activity,
                                      pickupQuestions:
                                        activity.pickupQuestions?.map((q) =>
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
            {mainContactDetails?.filter(
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
                            defaultValue={question.defaultValue ?? undefined}
                            value={question.answers ? question.answers[0] : ""}
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
                              (question.answers ? question.answers[0] : "no") !=
                              "no"
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
                                  ((question.answers
                                    ? question.answers[0]
                                    : "") == "" &&
                                    question.required) ||
                                  !isValid(
                                    question.answers ? question.answers[0] : "",
                                    question.dataFormat
                                  )
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
                            <span className="text-xs text-destructive">*</span>
                          )}
                        </Label>
                        <Input
                          value={question.answers ? question.answers[0] : ""}
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
            {activityBookings[0].passengers.length > 0 &&
              activityBookings[0].passengers.some(
                (passenger) =>
                  passenger.passengerDetails?.length > 0 ||
                  passenger.questions?.length > 0
              ) && (
                <Carousel className="w-full mx-auto border shadow p-2 rounded-lg">
                  <CarouselContent className="p-0">
                    {activityBookings[0].passengers.map((passenger, pIndx) => {
                      return (
                        <CarouselItem
                          key={passenger.bookingId}
                          className="w-full flex flex-col gap-2 items-start mx-auto"
                        >
                          <p className="w-fit max-w-full pr-4 border-b-2 border-primary text-base font-semibold">
                            {t("traveler-info", {
                              count: pIndx + 1,
                              category: displayT(
                                categoriesMap[passenger.pricingCategoryId].title
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
                                          i == 0
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
                                        prev.map((activity, i) =>
                                          i == 0
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
                                          ((question.answers
                                            ? question.answers[0]
                                            : "") == "" &&
                                            question.required) ||
                                          !isValid(
                                            question.answers
                                              ? question.answers[0]
                                              : "",
                                            question.dataFormat
                                          )
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
                                                i == 0
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
                                                i == 0
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
                                    question.answers ? question.answers[0] : ""
                                  }
                                  onChange={(e) => {
                                    setActivityBookings((prev) =>
                                      prev.map((activity, i) =>
                                        i == 0
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
                                                                      answers: [
                                                                        e.target
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
                                          i == 0
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
                                        prev.map((activity, i) =>
                                          i == 0
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
                                          ((question.answers
                                            ? question.answers[0]
                                            : "") == "" &&
                                            question.required) ||
                                          !isValid(
                                            question.answers
                                              ? question.answers[0]
                                              : "",
                                            question.dataFormat
                                          )
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
                                                i == 0
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
                                                i == 0
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
                                    question.answers ? question.answers[0] : ""
                                  }
                                  onChange={(e) => {
                                    setActivityBookings((prev) =>
                                      prev.map((activity, i) =>
                                        i == 0
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
                                                                      answers: [
                                                                        e.target
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
                    })}
                  </CarouselContent>
                  {activityBookings[0].passengers.length > 1 && (
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
                    ["firstName", "lastName", "email", "phoneNumber"].includes(
                      question.questionId
                    )
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
                setStep("paying");
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
                activityBookings.some((activity) =>
                  activity.passengers.some((passenger) =>
                    passenger.passengerDetails.some(
                      (question) =>
                        question.required &&
                        (question.answers ? question.answers[0] : "") == ""
                    )
                  )
                ) ||
                activityBookings.some((activity) =>
                  activity.passengers.some((passenger) =>
                    passenger.questions.some(
                      (question) =>
                        question.required &&
                        (question.answers ? question.answers[0] : "") == ""
                    )
                  )
                ) ||
                activityBookings.some((activity) =>
                  activity.questions?.some(
                    (question) =>
                      question.required &&
                      (question.answers ? question.answers[0] : "") == ""
                  )
                ) ||
                activityBookings.some((activity) =>
                  activity.pickupQuestions?.some(
                    (question) =>
                      question.required &&
                      (question.answers ? question.answers[0] : "") == ""
                  )
                )
              }
              className="w-full"
            >
              {t("proceed-payment")} <ArrowRight />
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
            {/*paymentRequest && (
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
                //paymentRequest?.show();
              }}
              variant={"outline"}
              className="shadow-xs! rounded p-0! h-fit! bg-black! hover:bg-black/90! text-white!"
            >
              <FaApplePay className="h-full! max-h-full! min-h-10! w-auto!" />
            </Button>
          </>
        )*/}
          </>
        )}

        {error.includes("_")
          ? error && <p className="text-red-600 text-sm mx-auto">{t(error)}</p>
          : error && <p className="text-red-600 text-sm mx-auto">{error}</p>}
      </form>
    </Form>
  );
};
