/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { bokunRequest, ContactInformationTypeDto, ExperienceBookingQuestionDto, FullExperienceType } from "@/utils/bokun-requests";
import { verifySession } from "@/utils/verifySession";
import { format } from "date-fns";

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