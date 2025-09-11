/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {
  ArrowRight,
  CalendarIcon,
  Edit2,
  Edit3,
  Loader2,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
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
  ContactInformationDto,
  ContactInformationTypeDto,
  ExperienceBookingQuestionDto,
  PickupPlaceDto,
} from "@/utils/bokun-requests";
import { CountrySelect } from "@/components/orders/country-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { PhoneInput } from "@/components/ui/phone-input";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
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

function isPaxInfoQuestion(
  obj: any
): obj is ContactInformationDto & { value: string; id: string } {
  return (
    typeof obj.touched === "boolean" &&
    typeof obj.id === "string" &&
    typeof obj.value === "string" &&
    typeof obj.required === "boolean" &&
    typeof obj.requiredBeforeDeparture === "boolean" &&
    (obj.type == "TITLE" ||
      obj.type == "FIRST_NAME" ||
      obj.type == "LAST_NAME" ||
      obj.type == "PERSONAL_ID_NUMBER" ||
      obj.type == "EMAIL" ||
      obj.type == "PHONE_NUMBER" ||
      obj.type == "NATIONALITY" ||
      obj.type == "GENDER" ||
      obj.type == "ORGANIZATION" ||
      obj.type == "PASSPORT_ID" ||
      obj.type == "PASSPORT_EXPIRY" ||
      obj.type == "ADDRESS" ||
      obj.type == "DATE_OF_BIRTH" ||
      obj.type == "LANGUAGE")
  );
}

function isPaxBookingQuestion(
  obj: any
): obj is ExperienceBookingQuestionDto & { value: string } {
  return (
    typeof obj.touched === "boolean" &&
    typeof obj.value === "string" &&
    typeof obj.id === "string" &&
    typeof obj.created === "number" &&
    typeof obj.lastModified === "number" &&
    typeof obj.label === "string" &&
    typeof obj.personalData === "boolean" &&
    typeof obj.required === "boolean" &&
    typeof obj.requiredBeforeDeparture === "boolean" &&
    typeof obj.help === "string" &&
    typeof obj.placeholder === "string" &&
    (obj.dataType === "SHORT_TEXT" ||
      obj.dataType === "LONG_TEXT" ||
      obj.dataType === "INT" ||
      obj.dataType === "DOUBLE" ||
      obj.dataType === "BOOLEAN" ||
      obj.dataType === "CHECKBOX_TOGGLE" ||
      obj.dataType === "DATE" ||
      obj.dataType === "DATE_AND_TIME" ||
      obj.dataType === "OPTIONS") &&
    typeof obj.defaultValue === "string" &&
    typeof (
      obj.context === "BOOKING" ||
      obj.context === "PASSENGER" ||
      obj.context === "EXTRA"
    ) &&
    typeof obj.placeholder === "string"
  );
}

export const TourCheckoutForm = ({
  bookingQuestions,
  meeting,
  rateId,
  mainPaxInfo,
  otherPaxInfo,
  guests,
  selectedStartTimeId,
  experienceId,
  selectedDate,
}: {
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
  const [loading, /*setLoading*/] = useState(false);
  const [error, setError] = useState("");
  const [_amount, /*setAmount*/] = useState(0);
  const [priceLoading, /*setPriceLoading*/] = useState(true);
  //const [checking, setChecking] = useState(true);
  const [loadingMessage, /*setLoadingMessage*/] = useState("");
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
  const [addOtherPaxDialogOpen, setAddOtherPaxDialogOpen] = useState(false);
  const [addOtherPaxBirthdayOpen, setAddOtherPaxBirthdayOpen] = useState(false);
  const [addOtherPaxDialogIndex, setAddOtherPaxDialogIndx] = useState<
    number | undefined
  >(undefined);
  console.log(meeting,selectedStartTimeId,experienceId,selectedDate);
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

  const [bookingAnswers, setBookingAnswers] = useState(
    bookingQuestions
      .filter((question) => question.context == "BOOKING")
      .map((question) => {
        return {
          ...question,
          value: "",
        };
      })
  );

  const [mainPaxAnswers, setMainPaxAnswers] = useState([
    ...bookingQuestions
      .filter((question) => question.context == "PASSENGER")
      .map((question) => {
        return {
          ...question,
          value: "",
          id: question.id.toString(),
          touched:true,
        };
      }),
    ...mainPaxInfo
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
            touched:true,
          };
        }
      })
      .filter((info) => info != undefined),
  ]);

  const [otherPaxAnswers, setOtherPaxAnswers] = useState(
    Array.from(
      {
        length: Object.values(guests).reduce((acc, curr) => acc + curr, 0) - 1,
      },
      (_v, k) => {
        return [
          ...bookingQuestions
            .filter((question) => question.context == "PASSENGER")
            .map((question) => {
              return {
                ...question,
                value: "",
                id: question.id.toString(),
                touched:false
              };
            }),
          ...(otherPaxInfo?.map((mainPaxInfoQuestion, indx) => {
            return {
              ...mainPaxInfoQuestion,
              value: "",
              id: `other-pax-${k}-${indx}`,
              touched:false
            };
          }) ?? []),
        ];
      }
    )
  );

  const [] = useState<{
    [indx: number]: Record<ContactInformationTypeDto | number, any>;
  }>({});

  const [otherPaxCurrentAnswers, setOtherPaxCurrentAnswers] = useState<
Record<string, string>
  >({});

  const [questionsError, setQuestionsError] = useState("");

  const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
    console.log(data);
  };

  const handleSubmitAnswers = async () => {
    const bookingAnswersIncomplete = bookingAnswers.some(
      (answer) =>
        answer.value == "" &&
        (answer.required == true || answer.requiredBeforeDeparture == true)
    );
    const mainPaxAnswersIncomplete = mainPaxAnswers.some(
      (answer) =>
        answer.value == "" &&
        (answer.required == true || answer.requiredBeforeDeparture == true)
    );
    const otherPaxAnswersIncomplete = otherPaxAnswers.some((pax) =>
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
  };

  const handleBookingAnswerChange = useCallback(
    (id: number, value: string) => {
      setBookingAnswers((prev) =>
        prev.map((q) => (q.id === id ? { ...q, value } : q))
      );
      setQuestionsError("");
    },
    [setBookingAnswers]
  );

  const handleMainPaxChange = useCallback((id: string, value: string) => {
    setMainPaxAnswers((prev) =>
      prev.map((answer) => (answer.id === id ? { ...answer, value } : answer))
    );
    setQuestionsError("");
  }, []);

  const handleOtherPaxBulkChange = useCallback(
    (indx: number, values: Record<string, string>) => {
      setOtherPaxAnswers((prev) =>
        prev.map((paxAnswers, paxIndex) => {
          if (paxIndex !== indx) return paxAnswers;
          return paxAnswers.map((answer) =>
            values.hasOwnProperty(answer.id)
              ? { ...answer, value: values[answer.id],  touched:true }
              : {...answer,touched:true}
          );
        })
      );
    },
    []
  );

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
                const bookingQuestion = bookingQuestions.filter((question) => {
                  const isRateSpecific =
                    question.rateTriggerSelection == "SELECTED_ONLY";
                  if (!isRateSpecific) {
                    return true;
                  }
                  const found = question.rateTriggers.find(
                    (trigger) => trigger.id == rateId
                  );
                  return found ? true : false;
                });
                if (bookingQuestion.length > 0) {
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
          <div className="w-full flex flex-col gap-4 items-start">
            {bookingAnswers.length > 0 && (
              <p className="sm:text-base text-sm pb-1 border-b-2 w-full max-w-[230px] border-b-primary font-semibold">
                {t("booking-questions")}
              </p>
            )}
            <div className="w-full flex flex-col gap-2 items-start">
              {bookingAnswers.map((bookingQuestion) => {
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
            {mainPaxAnswers.length > 0 && (
              <>
                <p className="sm:text-base text-sm pb-1 border-b-2 w-full max-w-[230px] border-b-primary font-semibold">
                  {t("main-pax-title")}
                </p>
                <div className="w-full flex flex-col gap-2 items-start">
                  {mainPaxAnswers.length > 0 && (
                    <>
                      {mainPaxAnswers.map((bookingQuestion) => {
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
                                  <FormLabel>{t("cc-number-title")}</FormLabel>
                                  <Input
                                    value={bookingQuestion.value}
                                    onChange={(e) => {
                                      handleMainPaxChange(
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
                                  <FormLabel>{t("passport-number")}</FormLabel>
                                  <Input
                                    value={bookingQuestion.value}
                                    onChange={(e) => {
                                      handleMainPaxChange(
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
                                  <FormLabel>{t("passport-expiry")}</FormLabel>
                                  <Input
                                    value={bookingQuestion.value}
                                    onChange={(e) => {
                                      handleMainPaxChange(
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
                                      const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
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
                        console.log(bookingQuestion);
                      })}
                    </>
                  )}
                </div>
              </>
            )}
            {otherPaxInfo &&
              otherPaxInfo.length > 0 &&
              Object.values(guests).reduce((prev, curr) => (prev += curr), 0) -
                1 >
                0 && (
                <>
                  <p className="sm:text-base text-sm pb-1 border-b-2 w-fit pr-4 border-b-primary font-semibold">
                    {t("other-travelers-info")}{" "}
                    {`${
                      otherPaxAnswers.filter(
                        (answer) =>
                          !answer.some((ans) =>
                            !ans.touched
                          )
                      ).length
                    }/${
                      Object.values(guests).reduce(
                        (prev, curr) => (prev += curr),
                        0
                      ) - 1
                    }`}
                  </p>
                  <div className="flex flex-row items-center justify-start gap-2 flex-wrap">
                    {otherPaxAnswers.filter(
                        (answer) =>
                          !answer.some((ans) =>
                            !ans.touched
                          )
                      )
                      .map((otherPaxAnswer, indx) => {
                        return (
                          <Button
                            key={indx}
                            onClick={() => {
                              const currentAnswers: Record<string,string> = {};
                              for(const answer of otherPaxAnswer){
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
                          variant={"secondary"}
                          className={cn(
                            "h-fit! w-fit p-2 rounded-full",
                            otherPaxAnswers.filter(
                              (answer) =>
                                !answer.some((ans) =>
                                  !ans.touched
                                )
                            ).length <
                              Object.values(guests).reduce(
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
                          {otherPaxAnswers.length > 0 && (
                            <>
                              {otherPaxAnswers[
                                addOtherPaxDialogIndex ?? 0
                              ].map((bookingQuestion) => {
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
                                            required={bookingQuestion.required}
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
                                            required={bookingQuestion.required}
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
                                            required={bookingQuestion.required}
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
                                            required={bookingQuestion.required}
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
                                            required={bookingQuestion.required}
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
                                            required={bookingQuestion.required}
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
                                            required={bookingQuestion.required}
                                            validator={(arg0: any) => {
                                              const regex = /^[A-Z0-9]{6,15}$/i;
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
                                              ] ?? ""?.toString() ?? ""
                                            }
                                            required={bookingQuestion.required}
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
                                              ] ?? ""?.toString() ?? ""
                                            }
                                            required={bookingQuestion.required}
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
                                            required={bookingQuestion.required}
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
                                            required={bookingQuestion.required}
                                            validator={(arg0: any) => {
                                              const regex = /^[A-Z0-9]{6,12}$/i;
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
                                            required={bookingQuestion.required}
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
                                                variant="outline"
                                                id="date"
                                                className="w-full justify-between font-normal"
                                              >
                                                {(otherPaxCurrentAnswers[
                                                  bookingQuestion.id
                                                ] ?? "") == "" ? "Select date" : otherPaxCurrentAnswers[
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
                                                  ] ?? "")!= ""
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
                                          <FormLabel>
                                            {t("your-language")}
                                          </FormLabel>
                                          <CountrySelect
                                            placeholder={t("lang-placeholder")}
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
                                            required={bookingQuestion.required}
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
                          onClick={() => {
                            const index = addOtherPaxDialogIndex ?? otherPaxAnswers.filter(
                              (answer) =>
                                !answer.some((ans) =>
                                  !ans.touched
                                )
                            ).length;
                            handleOtherPaxBulkChange(index,otherPaxCurrentAnswers);
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
            <Button onClick={handleSubmitAnswers} className="w-full">
              {t("proceed-payment")} <ArrowRight />
            </Button>
            {questionsError && <p className="text-sm font-semibold text-destructive">{questionsError}</p>}
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
