
'use server'

import { TourItem } from "@/hooks/cart-context";
import { ActivityBookingQuestionsDto, ActivityPlacesDto, FullExperienceType, PickupPlaceDto, QuestionSpecificationDto } from "@/utils/bokun-requests";
import { verifySession } from "@/utils/verifySession";
import { format, isSameDay } from "date-fns";
import { GetActivityAvailability } from "./getExperienceAvailability";
import { generateReservationID } from "@/lib/utils";
import { fetchClientSecret } from "./stripe";
import { registerOrder } from "./createOrder";
import { bokunRequest } from "@/utils/bokun-server";
import OrderModel from "@/models/Order";
import { stripe } from "@/lib/stripe";
import env from "@/utils/env";
import { sendMail } from "./sendMail";
import { getHtml } from "./getHtml";
import { getTranslations } from "next-intl/server";

export async function getExperience(id: number) {
  if (!(await verifySession())) {
    throw new Error("Unauthorized");
  }
  const response = await bokunRequest<FullExperienceType>({
    method: "GET",
    path: `/restapi/v2.0/experience/${id}/components?componentType=ALL`,
  });
  return response
}

export async function getCheckoutData(cart: TourItem[]) {
  return await Promise.all(
    cart
      .filter((item) => item.type == "activity")
      .map(async (item) => {
        const {
          selectedDate: date,
          selectedStartTimeId: startTimeId,
          selectedRateId,
          guests,
          id,
        } = item;
        const response = await bokunRequest<FullExperienceType>({
          method: "GET",
          path: `/restapi/v2.0/experience/${id}/components?componentType=ALL`,
        });
        if (!response.success) {
          return;
        }
        let meeting:
          | { type: "PICK_UP"; pickUpPlaces: PickupPlaceDto[] }
          | { type: "MEET_ON_LOCATION" }
          | {
            type: "MEET_ON_LOCATION_OR_PICK_UP";
            pickUpPlaces: PickupPlaceDto[];
          };
        switch (response.meetingType.type) {
          case "MEET_ON_LOCATION":
            meeting = { type: "MEET_ON_LOCATION" };
            break;
          case "PICK_UP":
            const pickUpPlaces = await bokunRequest<ActivityPlacesDto>({
              method: "GET",
              path: `/activity.json/${response.id}/pickup-places`,
            });
            if (pickUpPlaces.success) {
              meeting = {
                type: "PICK_UP",
                pickUpPlaces: pickUpPlaces.pickupPlaces,
              };
              break;
            }
            meeting = {
              type: "PICK_UP",
              pickUpPlaces: [],
            };
            break;
          case "MEET_ON_LOCATION_OR_PICK_UP":
            const pickUpPlacesMeet =
              await bokunRequest<ActivityPlacesDto>({
                method: "GET",
                path: `/activity.json/${response.id}/pickup-places`,
              });
            if (pickUpPlacesMeet.success) {
              meeting = {
                type: "MEET_ON_LOCATION_OR_PICK_UP",
                pickUpPlaces: pickUpPlacesMeet.pickupPlaces,
              };
              break;
            }
            meeting = {
              type: "MEET_ON_LOCATION_OR_PICK_UP",
              pickUpPlaces: [],
            };
            break;
        }
        const availabilityResponse = await GetActivityAvailability(
          response.id.toString(),
          date
        );
        if (!availabilityResponse) {
          return;
        }
        const availability = Object.values(availabilityResponse).find(
          (avail) => {
            return isSameDay(new Date(avail.date), date)
          }
        );
        if (!availability) {
          return;
        }
        const selectedRate = availability.rates.find(
          (rate) => rate.id == selectedRateId
        );
        if (!selectedRate) {
          return;
        }
        const startTime =
          startTimeId != 0
            ? response.startTimes.find(
              (startT) => startT.id == startTimeId
            )
            : undefined;

        const totalGuests = Object.values(guests).reduce(
          (sum, val) => sum + val,
          0
        );

        if (!availability.unlimitedAvailability) {
          if (
            availability.availabilityCount == 0 ||
            (availability.availabilityCount ?? 0) < totalGuests
          ) {
            return;
          } else if (
            (availability.minParticipantsToBookNow ?? 0) > totalGuests
          ) {
            return;
          }
        }

        return {
          guests: guests,
          rateId: selectedRate.id,
          selectedStartTimeId: startTime?.id ?? undefined,
          selectedDate: date,
          experienceId: response.id,
          meeting: meeting,
        };
      })
  )
}

export async function startShoppingCart(cartId: string, experienceId: number,
  rateId: number, selectedStartTimeId: number | undefined, selectedDate: string, guests: { [categoryId: number]: number }, pickupPlaceId?: string
) {
  if (!(await verifySession())) {
    throw new Error("Unauthorized");
  }
  const response = await bokunRequest<{ totalPrice: number }>({
    method: "POST",
    path: `/shopping-cart.json/session/${cartId}/activity?trackingCode=774327a1896b423b8f6a13b24095ec80`,  //17816 //?trackingCode=774327a1896b423b8f6a13b24095ec80
    body: {
      activityId: experienceId,
      rateId: rateId,
      date: selectedDate,
      startTimeId: selectedStartTimeId,
      pickup: pickupPlaceId ? true : false,
      pickupPlaceId,
      pricingCategoryBookings: Object.entries(guests).map((entry) => {
        const categoryId = entry[0];
        const count = entry[1];
        const pushed = []
        for (let i = 0; i < count; i++) {
          pushed.push({ pricingCategoryId: categoryId })
        }
        return pushed;
      }).flat()
    },
  });
  return response;
}

export async function removeActivity(cartId: string, experienceId: number) {
  const response = await bokunRequest<{ totalPrice: number }>({
    method: "GET",
    path: `/shopping-cart.json/session/${cartId}/remove-activity/${experienceId}`,
  })
  return response.success;
}

export async function getShoppingCartQuestion(cartId: string) {
  if (!(await verifySession())) {
    throw new Error("Unauthorized");
  }
  const response = await bokunRequest<{ options: { type: 'AGENT_AFFILIATE' | 'AGENT_CUSTOMER' | 'AGENT_RESELLER' | 'CUSTOMER_FULL_PAYMENT' | 'CUSTOMER_PARTIAL_PAYMENT' | 'CUSTOMER_NO_PAYMENT', questions: QuestionSpecificationDto[], amount: number }[], questions: { activityBookings: ActivityBookingQuestionsDto[], mainContactDetails: QuestionSpecificationDto[] } }>({
    method: "GET",
    path: `/checkout.json/options/shopping-cart/${cartId}`,
  })
  return response
}

export async function createBookingRequest({ mainContactDetails, activityBookings, checkoutOptionAnswers, clientAddress, clientEmail, clientName, clientPhone, clientNotes, clientTax, companyName, guests, selectedStartTimeId, isCompany, selectedRateId, }: {
  mainContactDetails: { questionId: string, values: string[] }[],
  activityBookings: { activityId: number, answers?: { questionId: string, values: string[] }[], pickupAnswers?: { questionId: string, values: string[] }[], rateId: number, startTimeId: number | undefined, date: string, pickup: boolean, pickupPlaceId: string | undefined, passengers: { pricingCategoryId: number, groupSize: number, passengerDetails: { questionId: string, values: string[] }[], answers: { questionId: string, values: string[] }[] }[] }[],
  checkoutOptionAnswers: { questionId: string, values: string[] }[], clientName: string, clientEmail: string, clientPhone: string,
  clientAddress: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }, isCompany: boolean, selectedRateId: number[],
  guests: { [categoryId: number]: number }[],
  selectedStartTimeId: number[],
  clientNotes?: string, clientTax?: string, companyName?: string
}) {
  if (!(await verifySession())) {
    throw new Error("Unauthorized");
  }
  const randomOrderId = generateReservationID();
  const response = await bokunRequest<{
    booking: {
      activityBookings: [{
        bookingId: number,
        parentBookingId: number,
        confirmationCode: string,
        productConfirmationCode: string,
        barcode: { value: string, barcodeType: "QR_CODE" | "CODE_128" | "PDF_417" | "DATA_MATRIX" | "AZTEC" },
        hasTicket: boolean,
        boxBooking: boolean,
        startDateTime: number,
        endDateTime: number,
        status: "CART" | "REQUESTED" | "RESERVED" | "CONFIRMED" | "TIMEOUT" | "ABORTED" | "CANCELLED" | "ERROR" | "ARRIVED" | "NO_SHOW" | "REJECTED",
        includedOnCustomerInvoice: boolean,
        title: string,
        totalPrice: number,
        priceWithDiscount: number,
        totalPriceAsText: string,
        priceWithDiscountAsText: string,
        discountPercentage: number,
        discountAmount: number,
        paidType: "PAID_IN_FULL" | "DEPOSIT" | "FREE" | "NOT_PAID" | "OVERPAID" | "REFUND" | "INVOICED" | "GIFT_CARD",
        activity: FullExperienceType,

      }],
      totalPrice: number, status: "CART" | "REQUESTED" | "RESERVED" | "CONFIRMED" | "TIMEOUT" | "ABORTED" | "CANCELLED" | "ERROR" | "ARRIVED" | "NO_SHOW" | "REJECTED", confirmationCode: string, bookingId: number
    },
  }>({
    method: "POST",
    path: `/checkout.json/submit`,  //17816 //?trackingCode=774327a1896b423b8f6a13b24095ec80
    body: {
      checkoutOption: 'CUSTOMER_FULL_PAYMENT',
      directBooking: {
        mainContactDetails,
        activityBookings: activityBookings.map((booking) => ({
          ...booking,
          ...(booking.pickupAnswers?.length ? { pickupAnswers: booking.pickupAnswers } : {}),
          ...(booking.answers?.length ? { answers: booking.answers } : {})
        })),
        externalBookingReference: randomOrderId,
        externalBookingEntityName: 'Alojamento Ideal',
      },
      sendNotificationToMainContact: false,
      paymentMethod: 'RESERVE_FOR_EXTERNAL_PAYMENT',
      checkoutOptionAnswers,
      source: 'DIRECT_REQUEST'
    },
  });
  console.log(response);
  if (!response.success || response.booking.status == 'ERROR' || !response.booking.totalPrice) {
    return false;
  }
  const amount = response.booking.totalPrice * 100;

  const cartItems: TourItem[] = response.booking.activityBookings.map((activity, i) => ({
    id: activity.activity.id,
    type: 'activity',
    name: activity.title,
    price: activity.totalPrice,
    selectedDate: format(new Date(activity.startDateTime), "yyyy-MM-dd"),
    selectedRateId: selectedRateId[i],
    selectedStartTimeId: selectedStartTimeId[i],
    guests: guests[i],
    photo: activity.activity.photos[0].originalUrl,
  }))

  const { success, client_secret, id } = await fetchClientSecret(
    { alojamentoIdeal: 0, detours: amount },
    clientName,
    clientEmail,
    clientPhone,
    clientNotes,
    [],
    clientAddress,
    [response.booking.confirmationCode.toString()]
  );

  const { success: order_success, orderId } = await registerOrder({
    name: clientName,
    email: clientEmail,
    phoneNumber: clientPhone,
    notes: clientNotes,
    reservationIds: [],
    reservationReferences: [],
    items: cartItems,
    payment_id: id || "",
    transaction_id: [],
    payment_method_id: "",
    tax_number: clientTax,
    isCompany,
    companyName,
    activityBookingIds: response.booking.activityBookings.map((activity) => activity.productConfirmationCode),
    activityBookingReferences: [response.booking.confirmationCode]
  });

  return { success: success && order_success, client_secret, payment_id: id, order_id: orderId };
}

export async function answerActivityBookingQuestions({
  mainContactDetails,
  activityBookingId,
  activityBookings
}:
  {
    mainContactDetails: { questionId: string, values: string[] }[],
    activityBookingId: number,
    activityBookings: {
      activityId: number,
      answers?: { questionId: string, values: string[] }[],
      pickupAnswers?: { questionId: string, values: string[] }[],
      bookingId: number,
      passengers?: {
        answers: { questionId: string, values: string[] }[],
        passengerDetails: { questionId: string, values: string[] }[],
        bookingId: number,
        pricingCategoryId: number
      }[]

    }[]
  }

) {
  const updatedResponse = await bokunRequest({
    method: "POST",
    path: `/question.json/booking/${activityBookingId}`,
    body: {
      mainContactDetails,
      activityBookings
    }
  })
  return updatedResponse.success;
}

export async function cancelActivityBooking({
  productConfirmationCode, totalPrice, refund_amount
}: { productConfirmationCode: string, totalPrice: number, refund_amount: number }) {
  if (!(await verifySession()))
    throw new Error("Unauthorized");
  try {
    const foundOrder = await OrderModel.findOne({ activityBookingIds: productConfirmationCode })
    if (!foundOrder) {
      return false;
    }
    const refundResponse = await bokunRequest<{travelDocuments:{invoice:string}}>({
      path: `/booking.json/cancel-product-booking/${productConfirmationCode}`, method: "POST", body: {
        refund: refund_amount > 0,
        refundAmount: Number(((totalPrice / 100) * refund_amount).toFixed(2)),
        notify: false,
      }
    });

    if(refundResponse.success){
      const email = foundOrder.email;
      const t = await getTranslations("order-email")
      const refundHtml = await getHtml('emails/invoice-sent-email.html',
        [{ "{{products_html}}":t("success-cancel",{code:productConfirmationCode}) },
        { "{{your-invoice-is-ready}}": t('activity-cancellation') },
        { "{{view-your-invoice}}": t('view-activity-page') },
        { "{{order-number}}": t('order-number', { order_id: foundOrder.orderId }) },
        { '{{invoice_url}}': `${env.SITE_URL}/reservations/activities/${productConfirmationCode}` }
        ])
        await sendMail({email,html:refundHtml,subject:t("activity-cancellation-id",{id:productConfirmationCode})})
    }

    if(refund_amount == 0){
      return refundResponse.success;
    }

    const payment_id = foundOrder.payment_id;
    const payment_intent = await stripe.paymentIntents.retrieve(payment_id);
    if (!payment_intent) {
      return false;
    }
    const charge = await stripe.charges.retrieve(payment_intent.latest_charge as string);
    if (!charge) {
      return;
    }
    const transfer = charge.transfer as string;
    if (!transfer) {
      return;
    }
    const refund = await stripe.refunds.create({
      charge: charge.id,
      amount: Number(((totalPrice / 100) * refund_amount).toFixed(2)) * 100,
    });

    if(refund){
      const email = foundOrder.email;
      const t = await getTranslations("order-email")
      const refundHtml = await getHtml('emails/invoice-sent-email.html',
        [{ "{{products_html}}":t("success-refund",{amount:refund.amount/100}) },
        { "{{your-invoice-is-ready}}": t('activity-cancellation') },
        { "{{view-your-invoice}}": t('view-activity-page') },
        { "{{order-number}}": t('order-number', { order_id: foundOrder.orderId }) },
        { '{{invoice_url}}': `${env.SITE_URL}/reservations/activities/${productConfirmationCode}` }
        ])
        await sendMail({email,html:refundHtml,subject:t("activity-refund-id",{id:productConfirmationCode})})
    }
    await stripe.transfers.createReversal(
      transfer,
      {
        amount: Number(((totalPrice / 100) * refund_amount).toFixed(2)) * 100,
      }
    );
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }


}