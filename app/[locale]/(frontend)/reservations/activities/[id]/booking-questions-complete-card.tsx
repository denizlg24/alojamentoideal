"use client";

import { answerActivityBookingQuestions } from "@/app/actions/getExperience";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  ActivityBookingQuestionsDto,
  categoriesMap,
  isValid,
  PassengerQuestionsDto,
  QuestionSpecificationDto,
} from "@/utils/bokun-requests";
import { DialogClose } from "@radix-ui/react-dialog";
import { PopoverClose } from "@radix-ui/react-popover";
import { format, parse } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

export const CompleteBookingQuestion = ({
  mainContactDetails,
  individualId,
  initialPickupQuestions,
  initialBookingQuestions,
  initialPassengers,
  activityBookingId,
  activityBookings,
}: {
  individualId: number;
  mainContactDetails: QuestionSpecificationDto[];
  activityBookings: ActivityBookingQuestionsDto[];
  activityBookingId: number;
  initialPickupQuestions?: QuestionSpecificationDto[];
  initialBookingQuestions?: QuestionSpecificationDto[];
  initialPassengers?: PassengerQuestionsDto[];
}) => {
  const displayT = useTranslations("tourDisplay");
  const t = useTranslations("checkout_form");
  const pathname = usePathname();
  const [pickupQuestions, setPickupQuestions] = useState(
    initialPickupQuestions
  );
  const [bookingQuestions, setBookingQuestions] = useState(
    initialBookingQuestions
  );
  const [passengers, setPassengers] = useState(initialPassengers);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  function answersChanged(arr1?: string[], arr2?: string[]) {
    if (!arr1 && !arr2) return false;
    if (!arr1 || !arr2) return true;
    if (arr1.length !== arr2.length) return true;
    return arr1.some((a, i) => a !== arr2[i]);
  }

  const hasChanges =
    bookingQuestions?.some((question) => {
      const initial = initialBookingQuestions?.find(
        (_q) => _q.questionId === question.questionId
      )?.answers;
      return answersChanged(question.answers, initial);
    }) ||
    pickupQuestions?.some((question) => {
      const initial = initialPickupQuestions?.find(
        (_q) => _q.questionId === question.questionId
      )?.answers;
      return answersChanged(question.answers, initial);
    }) ||
    passengers?.some((passenger, indx) =>
      passenger.passengerDetails?.some((question) => {
        const initialAnswer = initialPassengers
          ?.at(indx)
          ?.passengerDetails?.find(
            (_q) => _q.questionId === question.questionId
          )?.answers;
        return answersChanged(question.answers, initialAnswer);
      })
    ) ||
    passengers?.some((passenger, indx) =>
      passenger.questions?.some((question) => {
        const initialAnswer = initialPassengers
          ?.at(indx)
          ?.questions?.find(
            (_q) => _q.questionId === question.questionId
          )?.answers;
        return answersChanged(question.answers, initialAnswer);
      })
    );

  function validateAllQuestions() {
    let invalidFound = false;

    for (const question of bookingQuestions ?? []) {
      if ((question.answers?.[0] && !isValid(question.answers?.[0] ?? "", question.dataFormat)) || (!question.answers?.[0] && question.required)) {
        invalidFound = true;
        break;
      }
    }

    if (!invalidFound) {
      for (const question of pickupQuestions ?? []) {
        if ((question.answers?.[0] && !isValid(question.answers?.[0] ?? "", question.dataFormat)) || (!question.answers?.[0] && question.required)) {
          invalidFound = true;
          break;
        }
      }
    }

    if (!invalidFound) {
      for (const [, passenger] of (passengers ?? []).entries()) {
        for (const question of passenger.passengerDetails ?? []) {
          if ((question.answers?.[0] && !isValid(question.answers?.[0] ?? "", question.dataFormat)) || (!question.answers?.[0] && question.required)) {
            invalidFound = true;
            break;
          }
        }
        if (invalidFound) break;
      }
    }

    if (!invalidFound) {
      for (const [, passenger] of (passengers ?? []).entries()) {
        for (const question of passenger.questions ?? []) {
          if ((question.answers?.[0] && !isValid(question.answers?.[0] ?? "", question.dataFormat)) || (!question.answers?.[0] && question.required)) {
            invalidFound = true;
            break;
          }
        }
        if (invalidFound) break;
      }
    }
    return !invalidFound;
  }

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const handleSubmit = async () => {
    console.log("here");
    setSaving(true);
    const updateResponse = await answerActivityBookingQuestions({
      activityBookingId,
      activityBookings: activityBookings.map((activity) => {
        if (activity.bookingId == individualId) {
          return {
            activityId: activity.activityId,
            bookingId: activity.bookingId,
            answers:
              bookingQuestions?.map((question) => ({
                questionId: question.questionId,
                values: question.answers?.length ? question.answers : [""],
              })) ?? [],
            pickupAnswers:
              pickupQuestions?.map((question) => ({
                questionId: question.questionId,
                values: question.answers?.length ? question.answers : [""],
              })) ?? [],
            passengers: passengers?.map((passenger) => ({
              bookingId: passenger.bookingId,
              pricingCategoryId: passenger.pricingCategoryId,
              passengerDetails:
                passenger.passengerDetails?.map((question) => ({
                  questionId: question.questionId,
                  values: question.answers?.length ? question.answers : [""],
                })) ?? [],
              answers:
                passenger.questions?.map((question) => ({
                  questionId: question.questionId,
                  values: question.answers?.length ? question.answers : [""],
                })) ?? [],
            })),
          };
        }
        return {
          activityId: activity.activityId,
          bookingId: activity.bookingId,
          answers:
            activity.questions?.map((question) => ({
              questionId: question.questionId,
              values: question.answers?.length ? question.answers : [""],
            })) ?? [],
          pickupAnswers:
            activity.pickupQuestions?.map((question) => ({
              questionId: question.questionId,
              values: question.answers?.length ? question.answers : [""],
            })) ?? [],
          passengers: activity.passengers.map((passenger) => ({
            pricingCategoryId: passenger.pricingCategoryId,
            passengerDetails:
              passenger.passengerDetails?.map((question) => ({
                questionId: question.questionId,
                values: question.answers?.length ? question.answers : [""],
              })) ?? [],
            answers:
              passenger.questions?.map((question) => ({
                questionId: question.questionId,
                values: question.answers?.length ? question.answers : [""],
              })) ?? [],
            bookingId: passenger.bookingId,
          })),
        };
      }),
      mainContactDetails: mainContactDetails.map((question) => ({
        questionId: question.questionId,
        values: question.answers?.length ? question.answers : [""],
      })),
    });
    if (updateResponse) {
      closeBtnRef.current?.click();
      window.location.href = pathname;
    } else {
      setError(t("error-saving"));
    }
    setSaving(false);
  };

  return (
    <div className="w-full flex flex-col gap-4 items-start">
      {bookingQuestions && (
        <div className="w-full flex flex-col gap-2 items-start">
          <h1 className="text-sm font-semibold">{t("booking-details")}</h1>
          {bookingQuestions.map((question) => {
            if (question.dataType == "OPTIONS" || question.selectFromOptions) {
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
                    onValueChange={(v) => {
                      setError("");
                      setBookingQuestions((prev) =>
                        prev?.map((_q) =>
                          _q.questionId == question.questionId
                            ? { ..._q, answers: [v] }
                            : _q
                        )
                      );
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        "w-full",
                        ((question.answers ? question.answers[0] : "") == "" &&
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
                        placeholder={question.placeholder ?? t("choose-one")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {question.answerOptions.map((option) => {
                        if (option.value && option.label)
                          return (
                            <SelectItem value={option.value} key={option.value}>
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
                      (question.answers ? question.answers[0] : "no") != "no"
                    }
                    onCheckedChange={(c) => {
                      setError("");
                      setBookingQuestions((prev) =>
                        prev?.map((_q) =>
                          _q.questionId == question.questionId
                            ? { ..._q, answers: [c ? "yes" : "no"] }
                            : _q
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
                          ((question.answers ? question.answers[0] : "") ==
                            "" &&
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
                        {(question.answers ? question.answers[0] : "") != "" ? (
                          format(question.answers[0], "PPP")
                        ) : (
                          <span>{t("select-date")}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0 z-99!">
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
                          setError("");
                          if (!date) {
                            setBookingQuestions((prev) =>
                              prev?.map((_q) =>
                                _q.questionId == question.questionId
                                  ? { ..._q, answers: [""] }
                                  : _q
                              )
                            );
                          } else {
                            setBookingQuestions((prev) =>
                              prev?.map((_q) =>
                                _q.questionId == question.questionId
                                  ? {
                                      ..._q,
                                      answers: [format(date, "yyyy-MM-dd")],
                                    }
                                  : _q
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
                  value={question.answers.length ? question.answers[0] : ""}
                  onChange={(e) => {
                    setError("");
                    setBookingQuestions((prev) =>
                      prev?.map((_q) =>
                        _q.questionId == question.questionId
                          ? { ..._q, answers: [e.target.value] }
                          : _q
                      )
                    );
                  }}
                  className={cn(
                    "w-full",
                    ((question.answers ? question.answers[0] : "") == "" &&
                      question.required) ||
                      !isValid(question.answers?.[0] ?? "", question.dataFormat)
                      ? "border border-destructive"
                      : ""
                  )}
                />
              </div>
            );
          })}
        </div>
      )}
      {pickupQuestions && (
        <div className="w-full flex flex-col gap-2 items-start">
          <h1 className="text-sm font-semibold">{t("pickup-details")}</h1>
          <div className="w-full grid sm:grid-cols-2 grid-cols-1 gap-x-4 gap-y-2">
            {pickupQuestions.map((question) => {
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
                      onValueChange={(v) => {
                        setError("");
                        setPickupQuestions((prev) =>
                          prev?.map((_q) =>
                            _q.questionId == question.questionId
                              ? { ..._q, answers: [v] }
                              : _q
                          )
                        );
                      }}
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
                          placeholder={question.placeholder ?? t("choose-one")}
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
                        (question.answers ? question.answers[0] : "no") != "no"
                      }
                      onCheckedChange={(c) => {
                        setError("");
                        setPickupQuestions((prev) =>
                          prev?.map((_q) =>
                            _q.questionId == question.questionId
                              ? { ..._q, answers: [c ? "yes" : "no"] }
                              : _q
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
                            ((question.answers ? question.answers[0] : "") ==
                              "" &&
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
                      <PopoverContent
                        align="start"
                        className="w-auto p-0 z-99!"
                      >
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
                            setError("");
                            if (!date) {
                              setPickupQuestions((prev) =>
                                prev?.map((_q) =>
                                  _q.questionId == question.questionId
                                    ? { ..._q, answers: [""] }
                                    : _q
                                )
                              );
                            } else {
                              setPickupQuestions((prev) =>
                                prev?.map((_q) =>
                                  _q.questionId == question.questionId
                                    ? {
                                        ..._q,
                                        answers: [format(date, "yyyy-MM-dd")],
                                      }
                                    : _q
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
                    value={question.answers.length ? question.answers[0] : ""}
                    onChange={(e) => {
                      setError("");
                      setPickupQuestions((prev) =>
                        prev?.map((_q) =>
                          _q.questionId == question.questionId
                            ? { ..._q, answers: [e.target.value] }
                            : _q
                        )
                      );
                    }}
                    className={cn(
                      "w-full",
                      ((question.answers ? question.answers[0] : "") == "" &&
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
        </div>
      )}
      {passengers &&
        passengers.some(
          (passenger) =>
            passenger.passengerDetails?.length || passenger.questions?.length
        ) && (
          <div className="w-full flex flex-col gap-2 items-start">
            <Carousel className="w-full mx-auto">
              <CarouselContent className="p-0">
                {passengers.map((passenger, pIndx) => {
                  return (
                    <CarouselItem
                      key={passenger.bookingId}
                      className="w-full flex flex-col gap-2 items-start mx-auto border-none!"
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
                                  question.answers ? question.answers[0] : ""
                                }
                                onValueChange={(v) => {
                                  setError("");
                                  setPassengers((prev) =>
                                    prev?.map((pax, i) =>
                                      i == pIndx
                                        ? {
                                            ...pax,
                                            passengerDetails:
                                              pax.passengerDetails.map(
                                                (_question) =>
                                                  _question.questionId ==
                                                  question.questionId
                                                    ? {
                                                        ..._question,
                                                        answers: [v],
                                                      }
                                                    : _question
                                              ),
                                          }
                                        : pax
                                    )
                                  );
                                }}
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
                                  setError("");
                                  setPassengers((prev) =>
                                    prev?.map((pax, i) =>
                                      i == pIndx
                                        ? {
                                            ...pax,
                                            passengerDetails:
                                              pax.passengerDetails.map(
                                                (_question) =>
                                                  _question.questionId ==
                                                  question.questionId
                                                    ? {
                                                        ..._question,
                                                        answers: [
                                                          c ? "yes" : "no",
                                                        ],
                                                      }
                                                    : _question
                                              ),
                                          }
                                        : pax
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
                                <PopoverContent
                                  align="start"
                                  className="w-auto p-0 z-99!"
                                >
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
                                      setError("");
                                      if (!date) {
                                        setPassengers((prev) =>
                                          prev?.map((pax, i) =>
                                            i == pIndx
                                              ? {
                                                  ...pax,
                                                  passengerDetails:
                                                    pax.passengerDetails.map(
                                                      (_question) =>
                                                        _question.questionId ==
                                                        question.questionId
                                                          ? {
                                                              ..._question,
                                                              answers: [""],
                                                            }
                                                          : _question
                                                    ),
                                                }
                                              : pax
                                          )
                                        );
                                      } else {
                                        setPassengers((prev) =>
                                          prev?.map((pax, i) =>
                                            i == pIndx
                                              ? {
                                                  ...pax,
                                                  passengerDetails:
                                                    pax.passengerDetails.map(
                                                      (_question) =>
                                                        _question.questionId ==
                                                        question.questionId
                                                          ? {
                                                              ..._question,
                                                              answers: [
                                                                format(
                                                                  date,
                                                                  "yyyy-MM-dd"
                                                                ),
                                                              ],
                                                            }
                                                          : _question
                                                    ),
                                                }
                                              : pax
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
                                question.answers.length
                                  ? question.answers[0]
                                  : ""
                              }
                              onChange={(e) => {
                                setError("");
                                setPassengers((prev) =>
                                  prev?.map((pax, i) =>
                                    i == pIndx
                                      ? {
                                          ...pax,
                                          passengerDetails:
                                            pax.passengerDetails.map(
                                              (_question) =>
                                                _question.questionId ==
                                                question.questionId
                                                  ? {
                                                      ..._question,
                                                      answers: [e.target.value],
                                                    }
                                                  : _question
                                            ),
                                        }
                                      : pax
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
                                  question.answers ? question.answers[0] : ""
                                }
                                onValueChange={(v) => {
                                  setError("");
                                  setPassengers((prev) =>
                                    prev?.map((pax, i) =>
                                      i == pIndx
                                        ? {
                                            ...pax,
                                            questions: pax.questions.map(
                                              (_question) =>
                                                _question.questionId ==
                                                question.questionId
                                                  ? {
                                                      ..._question,
                                                      answers: [v],
                                                    }
                                                  : _question
                                            ),
                                          }
                                        : pax
                                    )
                                  );
                                }}
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
                                  setError("");
                                  setPassengers((prev) =>
                                    prev?.map((pax, i) =>
                                      i == pIndx
                                        ? {
                                            ...pax,
                                            questions: pax.questions.map(
                                              (_question) =>
                                                _question.questionId ==
                                                question.questionId
                                                  ? {
                                                      ..._question,
                                                      answers: [
                                                        c ? "yes" : "no",
                                                      ],
                                                    }
                                                  : _question
                                            ),
                                          }
                                        : pax
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
                                <PopoverContent
                                  align="start"
                                  className="w-auto p-0 z-99!"
                                >
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
                                      setError("");
                                      if (!date) {
                                        setPassengers((prev) =>
                                          prev?.map((pax, i) =>
                                            i == pIndx
                                              ? {
                                                  ...pax,
                                                  questions: pax.questions.map(
                                                    (_question) =>
                                                      _question.questionId ==
                                                      question.questionId
                                                        ? {
                                                            ..._question,
                                                            answers: [""],
                                                          }
                                                        : _question
                                                  ),
                                                }
                                              : pax
                                          )
                                        );
                                      } else {
                                        setPassengers((prev) =>
                                          prev?.map((pax, i) =>
                                            i == pIndx
                                              ? {
                                                  ...pax,
                                                  questions: pax.questions.map(
                                                    (_question) =>
                                                      _question.questionId ==
                                                      question.questionId
                                                        ? {
                                                            ..._question,
                                                            answers: [
                                                              format(
                                                                date,
                                                                "yyyy-MM-dd"
                                                              ),
                                                            ],
                                                          }
                                                        : _question
                                                  ),
                                                }
                                              : pax
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
                                question.answers.length
                                  ? question.answers[0]
                                  : ""
                              }
                              onChange={(e) => {
                                setError("");
                                setPassengers((prev) =>
                                  prev?.map((pax, i) =>
                                    i == pIndx
                                      ? {
                                          ...pax,
                                          questions: pax.questions.map(
                                            (_question) =>
                                              _question.questionId ==
                                              question.questionId
                                                ? {
                                                    ..._question,
                                                    answers: [e.target.value],
                                                  }
                                                : _question
                                          ),
                                        }
                                      : pax
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
              {passengers?.length > 1 && (
                <div className="absolute top-0 right-0">
                  <CarouselPrevious className="border-none p-0 right-0 top-4 shadow-none w-fit h-fit" />
                  <CarouselNext className="border-none p-0 right-2 top-4 shadow-none w-fit h-fit" />
                </div>
              )}
            </Carousel>
          </div>
        )}
      <div className="grid sm:grid-cols-2 grid-cols-1 gap-x-8 gap-y-1 w-full">
        <Button
          disabled={!hasChanges || saving}
          onClick={() => {
            console.log("Clicked");
            const validated = validateAllQuestions();
            if (!validated) {
              setError(t("all-fields-must-be-correct"));
              return;
            }
            handleSubmit();
          }}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" /> {t("saving")}
            </>
          ) : (
            t("save-answers")
          )}
        </Button>
        <DialogClose asChild>
          <Button ref={closeBtnRef} variant={"secondary"}>{t("cancel")}</Button>
        </DialogClose>
      </div>
      {error && (
        <div className="w-full text-center items-center text-xs font-semibold text-destructive">
          {error}
        </div>
      )}
    </div>
  );
};
