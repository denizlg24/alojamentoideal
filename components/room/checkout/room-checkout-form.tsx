"use client";

import cardSvg from "@/public/stripe-card.svg";
import sepaSvg from "@/public/stripe-sepa.svg";
import { calculateAmount } from "@/app/actions/calculateAmount";
import { CartItem } from "@/hooks/cart-context";
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
import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
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
} from "../../ui/form";
import { Input } from "../../ui/input";
import { useLocale, useTranslations } from "next-intl";
import { purchaseAccommodation } from "@/app/actions/createReservation";
import { ArrowRight, CalendarIcon, Edit3, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { checkVAT, countries } from "jsvat";
import { Country } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Separator } from "@/components/ui/separator";
import { FaApplePay } from "react-icons/fa6";
import { Appearance, PaymentRequest } from "@stripe/stripe-js";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { ok } from "assert";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, parse } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, localeMap } from "@/lib/utils";
import { CountrySelect } from "@/components/orders/country-select";
import { Guest } from "@/models/GuestData";
import { FeeType } from "@/schemas/price.schema";

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
    colorPrimary: "#694334",
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

export const RoomCheckoutForm = ({
  property,
  initialCountry = "PT",
}: {
  property: CartItem;
  initialCountry: string;
}) => {
  ok(property.type == "accommodation");
  const t = useTranslations("checkout_form");
  const stripe = useStripe();
  const elements = useElements();
  elements?.update({ appearance: elementStyle });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [_amount, setAmount] = useState(0);
  const [priceLoading, setPriceLoading] = useState(true);
  const [checking, setChecking] = useState(true);
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
  const isMobile = useIsMobile();
  const questionsT = useTranslations("propertyCard");
  const locale = useLocale();
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [pIndx, changePIndx] = useState(0);
  const [guest_data, setGuestData] = useState<Guest[]>(
    Array.from({
      length: property.adults + property.children + property.infants,
    }).map(() => ({
      first_name: "",
      last_name: "",
      document_type: "",
      document_number: "",
      document_country: "",
      nationality: "",
      birthday: "",
      arrival: "",
      departure: "",
      country_residence: "",
      city_residence: "",
    }))
  );
  const addGuestSchema = z.object({
    first_name: z.string().min(2, { message: "" }),
    last_name: z.string().min(2, { message: "" }),
    birthday: z.date(),
    document_type: z.enum(["P", "ID", "O"]),
    document_country: z.string(),
    document_number: z.string().min(2, { message: "" }),
    nationality: z.string(),
    country_residence: z.string(),
    city_residence: z.string().min(2, { message: "" }),
  });
  const addGuestForm = useForm<z.infer<typeof addGuestSchema>>({
    resolver: zodResolver(addGuestSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      document_type: "P",
      document_country: "PRT",
      document_number: "",
      nationality: "PRT",
      country_residence: "PRT",
      city_residence: "",
    },
  });

  async function onSubmitAddGuest(values: z.infer<typeof addGuestSchema>) {
    ok(property.type == "accommodation");
    setGuestData((prev) =>
      prev.map((prev, indx) =>
        indx == pIndx
          ? {
              ...values,
              birthday: format(values.birthday, "yyyy-MM-dd"),
              arrival: property.start_date,
              departure: property.end_date,
            }
          : prev
      )
    );

    if (pIndx + 1 == property.adults + property.children + property.infants) {
      setStep("paying");
      changePIndx(0);
      return;
    }
    if (guest_data[pIndx + 1].first_name) {
      addGuestForm.reset({
        ...guest_data[pIndx + 1],
        birthday: parse(
          guest_data[pIndx + 1].birthday,
          "yyyy-MM-dd",
          new Date()
        ),
        document_type: guest_data[pIndx + 1].document_type as "P" | "ID" | "O",
      });
    } else {
      addGuestForm.reset();
    }

    changePIndx((prev) => prev + 1);

    /*setGuestData((prev) => {
    return prev?.map((guest_data,indx) => indx == pIndx ? {
      ...values,
      birthday: format(values.birthday, "yyyy-MM-dd"),
      arrival: property.start_date,
      departure: property.end_date,
    }: guest_data)
  })
    addGuestForm.reset();*/
  }

  const [needCompanySwitch, setNeedCompanySwitch] = useState(false);
  const [vatCountryCode, setVatCountryCode] = useState("PT");
  const [selectedTab, selectTab] = useState("card");
  const [step, setStep] = useState<"client_info" | "questions" | "paying">(
    "client_info"
  );
  const [fees,setFees] = useState<FeeType[][]>([]);

  const router = useRouter();
  useEffect(() => {
    const getAmount = async () => {
      setPriceLoading(true);
      const amount = await calculateAmount([property]);
      setAmount(amount.total);
      setFees(amount.fees);
      setPriceLoading(false);
    };
    if (!property) {
      if (document.referrer && document.referrer !== window.location.href) {
        router.back();
      } else {
        router.push("/");
      }
    } else {
      setChecking(false);
      getAmount();
    }
  }, [property, router]);

  const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
    setLoading(true);
    setLoadingMessage("loading_verify_price");
    setError("");

    if (property.type != "accommodation") {
      return;
    }
    if (!addressData) {
      setLoading(false);
      setError("provide_information");
      return;
    }
    if (!guest_data.length) {
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
    const clientTax = data.vat ? data.vat.length > 2 ? data.vat : undefined : undefined;
    const clientAddress = addressData.address;
    setLoadingMessage("loading_create_res");
    const {
      success,
      client_secret,
      payment_id,
      reservation,
      transaction,
      order_id,
    } = await purchaseAccommodation({
      amount:{total:_amount,fees:fees[0]},
      property,
      clientName,
      clientEmail,
      clientPhone,
      clientNotes,
      clientAddress,
      clientTax,
      isCompany: needCompanySwitch,
      companyName: clientBusiness,
      guest_data,
    });

    if (
      !success ||
      !reservation?.reservation.id ||
      !client_secret ||
      !payment_id ||
      !transaction
    ) {
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
    if (!stripe || property.type != "accommodation") return;

    const pr = stripe.paymentRequest({
      country: "PT",
      currency: "eur",
      total: {
        label: "Alojamento Ideal",
        amount: _amount, // in cents
      },
      displayItems: [
        {
          label: property.name,
          amount: property.front_end_price * 100,
        },
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
        const clientTax =  clientInfo.getValues("vat") ?  clientInfo.getValues("vat")!.length > 2 ?  clientInfo.getValues("vat") : undefined : undefined;
        const clientAddress = addressData.address;
        setLoadingMessage("loading_create_res");
        const {
          success,
          client_secret,
          payment_id,
          reservation,
          transaction,
          order_id,
        } = await purchaseAccommodation({
          amount:{total:_amount,fees:fees[0]},
          property,
          clientName,
          clientEmail,
          clientPhone,
          clientNotes,
          clientAddress,
          clientTax,
          isCompany: needCompanySwitch,
          companyName: clientBusiness,
          guest_data,
        });
        if (
          !success ||
          !reservation?.reservation.id ||
          !client_secret ||
          !payment_id ||
          !transaction
        ) {
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
    property,
    addressData,
    clientInfo,
    router,
    needCompanySwitch,
    guest_data,
    fees
  ]);

  //questions

  if (checking) return null;

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
                      defaultValues: !addressData
                        ? {
                            address: {
                              country: initialCountry,
                            },
                          }
                        : {},
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
                    defaultValues: !addressData
                      ? {
                          address: {
                            country: initialCountry,
                          },
                        }
                      : {},
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
                  if (guest_data[0].first_name) {
                    addGuestForm.reset({
                      ...guest_data[0],
                      birthday: parse(
                        guest_data[0].birthday,
                        "yyyy-MM-dd",
                        new Date()
                      ),
                      document_type: guest_data[0].document_type as
                        | "P"
                        | "ID"
                        | "O",
                    });
                  }
                  setStep("questions");
                }}
              >
                {t("continue")} <ArrowRight />
              </Button>
            </>
          )}

          {step == "questions" && (
            <>
              <div
                key={"Adult-" + pIndx}
                className="w-full flex flex-col gap-2 items-start mx-auto border-none!"
              >
                <p className="w-fit max-w-full pr-4 border-b-2 border-primary text-base font-semibold">
                  {t("guest-info", {
                    count: pIndx + 1,
                    category:
                      pIndx < property.adults
                        ? t("adult")
                        : pIndx >= property.adults &&
                          pIndx < property.adults + property.children
                        ? questionsT("children")
                        : questionsT("infant"),
                  })}
                </p>
                <Form {...addGuestForm}>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="-mt-1 sm:grid flex flex-col grid-cols-2 w-full gap-1">
                      <div className="flex flex-col gap-0 col-span-1">
                        <p className="text-sm">{questionsT("first-name")}</p>
                        <FormField
                          control={addGuestForm.control}
                          name="first_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={questionsT(
                                    "first_name_placeholder"
                                  )}
                                  className="grow"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-0 col-span-1">
                        <p className="text-sm">{questionsT("last-name")}</p>
                        <FormField
                          control={addGuestForm.control}
                          name="last_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={questionsT(
                                    "last_name_placeholder"
                                  )}
                                  className="grow"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-0 col-span-1">
                        <p className="text-sm">{questionsT("birthdate")}</p>
                        <FormField
                          control={addGuestForm.control}
                          name="birthday"
                          render={({ field }) => {
                            if (isMobile) {
                              return (
                                <FormItem>
                                  <FormControl>
                                    <Dialog
                                      open={birthdayOpen}
                                      onOpenChange={setBirthdayOpen}
                                    >
                                      <DialogTrigger asChild>
                                        <Button
                                          type="button"
                                          variant={"outline"}
                                          className={cn(
                                            "grow pl-3 text-left font-normal",
                                            !field.value &&
                                              "text-muted-foreground",
                                            addGuestForm.getFieldState(
                                              "birthday"
                                            ).error &&
                                              "outline-destructive outline"
                                          )}
                                        >
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="w-[300px] overflow-hidden p-0 z-99 pt-6 gap-1">
                                        <DialogHeader>
                                          <DialogTitle>
                                            {questionsT("birthdate")}
                                          </DialogTitle>
                                          <DialogDescription className="hidden">
                                            Birthday
                                          </DialogDescription>
                                        </DialogHeader>
                                        <Calendar
                                          mode="single"
                                          className="mx-auto"
                                          defaultMonth={
                                            field.value ?? undefined
                                          }
                                          showOutsideDays={false}
                                          locale={
                                            localeMap[
                                              locale as keyof typeof localeMap
                                            ]
                                          }
                                          selected={field.value}
                                          onSelect={(date) => {
                                            field.onChange(date);
                                            setBirthdayOpen(false);
                                          }}
                                          disabled={(date) =>
                                            date > new Date() ||
                                            date < new Date("1900-01-01")
                                          }
                                          captionLayout="dropdown-years"
                                        />
                                      </DialogContent>
                                    </Dialog>
                                  </FormControl>
                                </FormItem>
                              );
                            }
                            return (
                              <FormItem>
                                <FormControl>
                                  <Popover
                                    open={birthdayOpen}
                                    onOpenChange={setBirthdayOpen}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        type="button"
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value &&
                                            "text-muted-foreground",
                                          addGuestForm.formState.errors
                                            .birthday &&
                                            "border! border-destructive!"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-auto overflow-hidden p-0 z-99"
                                      align="start"
                                    >
                                      <Calendar
                                        defaultMonth={field.value ?? undefined}
                                        mode="single"
                                        showOutsideDays={false}
                                        locale={
                                          localeMap[
                                            locale as keyof typeof localeMap
                                          ]
                                        }
                                        selected={field.value}
                                        onSelect={(d) => {
                                          setBirthdayOpen(false);
                                          field.onChange(d);
                                        }}
                                        disabled={(date) =>
                                          date > new Date() ||
                                          date < new Date("1900-01-01")
                                        }
                                        captionLayout="dropdown-years"
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </FormControl>
                              </FormItem>
                            );
                          }}
                        />
                      </div>

                      <div className="flex flex-col gap-0">
                        <p className="text-sm">{questionsT("document")}</p>
                        <FormField
                          control={addGuestForm.control}
                          name="document_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select
                                  {...field}
                                  value={field.value}
                                  onValueChange={(v) => {
                                    field.onChange(v);
                                  }}
                                  defaultValue="P"
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue
                                      placeholder={questionsT("passport")}
                                    />
                                  </SelectTrigger>
                                  <SelectContent className="z-99 w-full">
                                    <SelectItem value="P">
                                      {questionsT("passport")}
                                    </SelectItem>
                                    <SelectItem value="ID">
                                      {questionsT("id")}
                                    </SelectItem>
                                    <SelectItem value="O">
                                      {questionsT("other")}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-0">
                        <p className="text-sm">
                          {questionsT("document_country")}
                        </p>

                        <FormField
                          control={addGuestForm.control}
                          name="document_country"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <CountrySelect
                                  {...field}
                                  value={field.value}
                                  onChange={(v) => {
                                    field.onChange(v);
                                  }}
                                  defaultValue="PRT"
                                  className="z-99 w-full"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-0">
                        <p className="text-sm">
                          {questionsT("document_number")}
                        </p>

                        <FormField
                          control={addGuestForm.control}
                          name="document_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={questionsT("doc_id_placeholder")}
                                  className="grow"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-0">
                        <p className="text-sm">{questionsT("nationality")}</p>
                        <FormField
                          control={addGuestForm.control}
                          name="nationality"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <CountrySelect
                                  {...field}
                                  defaultValue="PRT"
                                  className="z-99 w-full"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-0">
                        <p className="text-sm">{questionsT("residence")}</p>
                        <FormField
                          control={addGuestForm.control}
                          name="country_residence"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <CountrySelect
                                  {...field}
                                  defaultValue="PRT"
                                  className="z-99 w-full"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-0">
                        <p className="text-sm">
                          {questionsT("residence-city")}
                        </p>
                        <FormField
                          control={addGuestForm.control}
                          name="city_residence"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={questionsT("city_placeholder")}
                                  className="grow"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {Object.keys(addGuestForm.formState.errors).length >
                        0 && (
                        <p className="text-sm text-destructive text-center w-full col-span-full">
                          {questionsT("all-fields-required")}
                        </p>
                      )}
                    </div>
                  </div>
                </Form>
              </div>
              <Button
                type="button"
                onClick={async () => {
                  const success = await addGuestForm.trigger();
                  if (success) {
                    onSubmitAddGuest(addGuestForm.getValues());
                  }
                }}
              >
                {t("continue")} <ArrowRight />
              </Button>
            </>
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
                      {(clientInfo.getValues("vat") ?? "").length > 2 ? clientInfo.getValues("vat") : ""}
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
                      changePIndx(0);
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
