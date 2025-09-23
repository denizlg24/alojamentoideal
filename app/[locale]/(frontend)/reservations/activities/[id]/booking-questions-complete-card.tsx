"use client";

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
import { cn } from "@/lib/utils";
import {
  categoriesMap,
  isValid,
  PassengerQuestionsDto,
  QuestionSpecificationDto,
} from "@/utils/bokun-requests";
import { DialogClose } from "@radix-ui/react-dialog";
import { PopoverClose } from "@radix-ui/react-popover";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export const CompleteBookingQuestion = ({
  initialPickupQuestions,
  initialBookingQuestions,
  initialPassengers,
}: {
  initialPickupQuestions?: QuestionSpecificationDto[];
  initialBookingQuestions: QuestionSpecificationDto[];
  initialPassengers: PassengerQuestionsDto[];
}) => {
  const displayT = useTranslations("tourDisplay");
  const t = useTranslations("checkout_form");

  const [pickupQuestions, setPickupQuestions] = useState(
    initialPickupQuestions
  );
  const [bookingQuestions, setBookingQuestions] = useState(
    initialBookingQuestions
  );
  const [passengers, setPassengers] = useState(initialPassengers);

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
                    onValueChange={(v) =>
                      setBookingQuestions((prev) =>
                        prev?.map((_q) =>
                          _q.questionId == question.questionId
                            ? { ..._q, answers: [v] }
                            : _q
                        )
                      )
                    }
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
                  value={question.answers ? question.answers[0] : ""}
                  onChange={(e) => {
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
                      onValueChange={(v) =>
                        setPickupQuestions((prev) =>
                          prev?.map((_q) =>
                            _q.questionId == question.questionId
                              ? { ..._q, answers: [v] }
                              : _q
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
                    value={question.answers ? question.answers[0] : ""}
                    onChange={(e) => {
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
                                onValueChange={(v) =>
                                  setPassengers((prev) =>
                                    prev.map((pax, i) =>
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
                                  setPassengers((prev) =>
                                    prev.map((pax, i) =>
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
                                      if (!date) {
                                        setPassengers((prev) =>
                                          prev.map((pax, i) =>
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
                                          prev.map((pax, i) =>
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
                                question.answers ? question.answers[0] : ""
                              }
                              onChange={(e) => {
                                setPassengers((prev) =>
                                  prev.map((pax, i) =>
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
                                onValueChange={(v) =>
                                  setPassengers((prev) =>
                                    prev.map((pax, i) =>
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
                                  setPassengers((prev) =>
                                    prev.map((pax, i) =>
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
                                      if (!date) {
                                        setPassengers((prev) =>
                                          prev.map((pax, i) =>
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
                                          prev.map((pax, i) =>
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
                                question.answers ? question.answers[0] : ""
                              }
                              onChange={(e) => {
                                setPassengers((prev) =>
                                  prev.map((pax, i) =>
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
        <Button disabled={bookingQuestions == initialBookingQuestions && passengers == initialPassengers && pickupQuestions == initialPickupQuestions}>{t("save-answers")}</Button>
        <DialogClose asChild>
          <Button variant={"secondary"}>{t("cancel")}</Button>
        </DialogClose>
      </div>
    </div>
  );
};
