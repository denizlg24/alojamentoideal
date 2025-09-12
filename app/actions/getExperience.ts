/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { TourItem } from "@/hooks/cart-context";
import { ActivityPlacesDto, bokunRequest, ContactInformationTypeDto, ExperienceBookingQuestionDto, FullExperienceType, PickupPlaceDto } from "@/utils/bokun-requests";
import { verifySession } from "@/utils/verifySession";
import { addDays, format, isSameDay } from "date-fns";
import { GetActivityAvailability } from "./getExperienceAvailability";

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

export async function getCheckoutData(cart:TourItem[]){
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

export async function startShoppingCart(experienceId: number, rateId: number, selectedStartTimeId: number | undefined, selectedDate: Date, guests: { [categoryId: number]: number }, bookingAnswers: {
    [bookingQuestionId: number]: any;
}, bookingQuestions: ExperienceBookingQuestionDto[], mainPaxInfo: Partial<Record<ContactInformationTypeDto, any>>, otherPaxInfo: {
    [indx: number]: Record<ContactInformationTypeDto, any>;
}) {
    if (!(await verifySession())) {
        throw new Error("Unauthorized");
    }
    console.log(mainPaxInfo,otherPaxInfo);
    const response = await bokunRequest({
        method: "POST",
        path: `/booking.json/activity-booking/reserve-and-confirm`,
        body: {
            mainContactDetails: {

            },
            activityRequest: {
                activityId: experienceId,
                answers: Object.keys(bookingAnswers).map((answerId) => {
                    const bookingQuestionIds = bookingQuestions.filter((question) => question.context == "BOOKING").map((question) => question.id);
                    const numberAnswerId = parseInt(answerId);
                    if (bookingQuestionIds.includes(numberAnswerId)) {
                        return {
                            questionId: numberAnswerId,
                            values: [(bookingAnswers[parseInt(answerId)] as string).toString()]
                        }
                    }
                }),
                rateId: rateId,
                date: format(selectedDate, "yyyy-MM-dd"),
                startTimeId: selectedStartTimeId,
                pickup: false,
                passengers: Object.keys(guests).map((categoryId) => {
                    return {
                        pricingCategoryId: categoryId,
                        passengerDetails: Object.keys(bookingAnswers).map((answerId) => {
                            const passengerQuestionIds = bookingQuestions.filter((question) => question.context == "PASSENGER").map((question) => question.id);
                            const numberAnswerId = parseInt(answerId);
                            if (passengerQuestionIds.includes(numberAnswerId)) {
                                return {
                                    questionId: numberAnswerId,
                                    values: [(bookingAnswers[parseInt(answerId)] as string).toString()]
                                }
                            }
                        })
                    }
                })
            }
            ,
            customer: {
                email: 'denizlg24@gmail.com',
                firstName: 'Deniz',
                lastName: 'Gunes',
                dateOfBirth: "2004-04-24"
            }

        },
    });
    console.log(response);
}