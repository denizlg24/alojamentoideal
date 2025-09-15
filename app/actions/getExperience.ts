
'use server'

import { TourItem } from "@/hooks/cart-context";
import { ActivityBookingQuestionsDto, ActivityPlacesDto, bokunRequest, FullExperienceType, PickupPlaceDto, QuestionSpecificationDto } from "@/utils/bokun-requests";
import { verifySession } from "@/utils/verifySession";
import { addDays, format, isSameDay } from "date-fns";
import { GetActivityAvailability } from "./getExperienceAvailability";
import { generateReservationID } from "@/lib/utils";
import { fetchClientSecret } from "./stripe";
import { registerOrder } from "./createOrder";

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
          new Date(date),
          addDays(new Date(date), 1)
        );
        if (!availabilityResponse) {
          return;
        }
        const availability = Object.values(availabilityResponse).find(
          (avail) => isSameDay(avail.date, new Date(date))
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
          bookingQuestions: response.bookingQuestions,
          mainPaxInfo: response.mainPaxInfo,
          otherPaxInfo: response.otherPaxInfo,
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
  rateId: number, selectedStartTimeId: number | undefined, selectedDate: Date, guests: { [categoryId: number]: number }, pickupPlaceId?: string
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
      date: format(selectedDate, "yyyy-MM-dd"),
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
  activityBookings: { activityId: number, answers: { questionId: string, values: string[] }[], pickupAnswers: { questionId: string, values: string[] }[], rateId: number, startTimeId: number | undefined, date: string, pickup: boolean, pickupPlaceId: string | undefined, passengers: { pricingCategoryId: number, groupSize: number, passengerDetails: { questionId: string, values: string[] }[], answers: { questionId: string, values: string[] }[] }[] }[],
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
        barcode: { value: string, barcodeType: "QR_CODE"|"CODE_128"|"PDF_417"|"DATA_MATRIX"|"AZTEC" },
        hasTicket: boolean,
        boxBooking: boolean,
        startDateTime: number,
        endDateTime: number,
        status: "CART"|"REQUESTED"|"RESERVED"|"CONFIRMED"|"TIMEOUT"|"ABORTED"|"CANCELLED"|"ERROR"|"ARRIVED"|"NO_SHOW"|"REJECTED",
        includedOnCustomerInvoice: boolean,
        title: string,
        totalPrice: number,
        priceWithDiscount: number,
        totalPriceAsText: string,
        priceWithDiscountAsText: string,
        discountPercentage: number,
        discountAmount: number,
        paidType: "PAID_IN_FULL"|"DEPOSIT"|"FREE"|"NOT_PAID"|"OVERPAID"|"REFUND"|"INVOICED"|"GIFT_CARD",
        activity:FullExperienceType,

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
        activityBookings,
        externalBookingReference: randomOrderId,
        externalBookingEntityName: 'Alojamento Ideal',
      },
      sendNotificationToMainContact: false,
      paymentMethod: 'RESERVE_FOR_EXTERNAL_PAYMENT',
      checkoutOptionAnswers,
      source: 'DIRECT_REQUEST'
    },
  });
  if (!response.success || response.booking.status == 'ERROR' || !response.booking.totalPrice) {
    return false;
  }
  const amount = response.booking.totalPrice * 100;

  const cartItems: TourItem[] = response.booking.activityBookings.map((activity, i) => ({
    id: activity.activity.id,
    type: 'activity',
    name: activity.title,
    price: activity.totalPrice,
    selectedDate: new Date(activity.startDateTime),
    selectedRateId: selectedRateId[i],
    selectedStartTimeId: selectedStartTimeId[i],
    guests: guests[i],
    photo: activity.activity.photos[0].originalUrl,
  }))

  const { success, client_secret, id } = await fetchClientSecret(
    amount,
    clientName,
    clientEmail,
    clientPhone,
    clientNotes,
    [],
    clientAddress,
    [response.booking.bookingId.toString()]
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
    activityBookingIds:[response.booking.bookingId.toString()],
    activityBookingReferences:[response.booking.confirmationCode]
  });

  return { success: success && order_success, client_secret, payment_id: id, order_id: orderId };
}

export async function ConfirmBookingRequest({

}){

}