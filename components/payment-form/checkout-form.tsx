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
import { Loader2, ArrowRight, Edit3 } from "lucide-react";
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
  PickupPlaceDto,
  QuestionSpecificationDto,
} from "@/utils/bokun-requests";
import { Skeleton } from "../ui/skeleton";
import {
  getShoppingCartQuestion,
  startShoppingCart,
} from "@/app/actions/getExperience";

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
                    setStep("paying");
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
