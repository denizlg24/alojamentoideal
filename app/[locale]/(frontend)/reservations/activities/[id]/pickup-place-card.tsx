"use client";

import { RoomInfoMap } from "@/components/room/room-info-map";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
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
  isValid,
  PickupPlaceDto,
  QuestionSpecificationDto,
} from "@/utils/bokun-requests";
import { PopoverClose } from "@radix-ui/react-popover";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export const PickupPlaceCard = ({
  initialPickupQuestions,
  initialPickup
}: {
  initialPickup: PickupPlaceDto | undefined;
  initialPickupQuestions?: QuestionSpecificationDto[];
}) => {
  const t = useTranslations("propertyCard");
  const [pickupQuestions, setPickupQuestions] = useState(
    initialPickupQuestions
  );
  return (
    <Card className="w-full flex flex-col gap-4 p-4!">
      <div className="w-full flex flex-col gap-1">
        <h1 className="sm:text-base text-sm font-bold">{t("we-can-pickup")}</h1>
        <h2 className="sm:text-sm text-xs">{t("modifications-to-pickup-unavailable")}</h2>
      </div>

      {pickupQuestions && (
        <div className="w-full grid sm:grid-cols-2 grid-cols-1 items-start gap-x-6 gap-y-3">
          <div className="w-full flex flex-col gap-1 items-start">
            <Label className="text-sm font-normal">{t("pickup-place")}</Label>
            <Input
            disabled
              value={initialPickup?.title ?? t("i-want-to-select-my-own")}
            />
          </div>
          {pickupQuestions.map((question) => {
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
                    disabled
                    defaultValue={question.defaultValue ?? undefined}
                    value={question.answers ? question.answers[0] : ""}
                    onValueChange={(v) =>
                      setPickupQuestions((prev) =>
                        prev?.map((_question) =>
                          _question.questionId == question.questionId
                            ? {
                                ...question,
                                answers: [v],
                              }
                            : _question
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
                    disabled
                    checked={
                      (question.answers ? question.answers[0] : "no") != "no"
                    }
                    onCheckedChange={(c) => {
                      setPickupQuestions((prev) =>
                        prev?.map((_question) =>
                          _question.questionId == question.questionId
                            ? {
                                ...question,
                                answers: [c ? "yes" : "no"],
                              }
                            : _question
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
                        disabled
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
                            setPickupQuestions((prev) =>
                              prev?.map((_question) =>
                                _question.questionId == question.questionId
                                  ? {
                                      ...question,
                                      answers: [""],
                                    }
                                  : _question
                              )
                            );
                          } else {
                            setPickupQuestions((prev) =>
                              prev?.map((_question) =>
                                _question.questionId == question.questionId
                                  ? {
                                      ...question,
                                      answers: [format(date, "yyyy-MM-dd")],
                                    }
                                  : _question
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
                  disabled
                  value={question.answers ? question.answers[0] ?? "" : ""}
                  onChange={(e) => {
                    setPickupQuestions((prev) =>
                      prev?.map((_question) =>
                        _question.questionId == question.questionId
                          ? {
                              ...question,
                              answers: [e.target.value],
                            }
                          : _question
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
      {initialPickup && (
        <div className="flex flex-col gap-2 w-full">
          <h1 className="text-sm">
            {t("your-selected-spot")}
            <span className="font-semibold"> {initialPickup.title}</span>
          </h1>
          <div className="w-full h-[250px] rounded-lg overflow-hidden shadow">
            <RoomInfoMap
            key={initialPickup.location.latitude.toString()+initialPickup.location.longitude.toString()}
              lat={initialPickup.location.latitude}
              long={initialPickup.location.longitude}
              street={initialPickup.location.address}
            />
          </div>
        </div>
      )}
    </Card>
  );
};
