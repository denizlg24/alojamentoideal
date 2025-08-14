import { clsx, type ClassValue } from "clsx"
import { format } from "date-fns/format";
import { enUS, es, pt } from "date-fns/locale";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseTimeToSeconds(input: string): number | null {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, "");

  let match = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const s = parseInt(match[3] || "0", 10);
    if (h < 24 && m < 60 && s < 60) return h * 3600 + m * 60 + s;
  }

  match = normalized.match(/^(\d{1,2})(\d{2})$/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (h < 24 && m < 60) return h * 3600 + m * 60;
  }

  match = normalized.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2] || "0", 10);
    const ampm = match[3];
    if (h === 12) h = 0;
    if (ampm === "pm") h += 12;
    return h * 3600 + m * 60;
  }

  match = normalized.match(/^(\d{1,2})\.(\d{2})(am|pm)$/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[3];
    if (h === 12) h = 0;
    if (ampm === "pm") h += 12;
    return h * 3600 + m * 60;
  }

  return null;
}

export function formatSecondsToHHMM(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const paddedHours = hours.toString().padStart(2, "0");
  const paddedMinutes = minutes.toString().padStart(2, "0");

  return `${paddedHours}:${paddedMinutes}`;
}


export function isTimeUpTo(inputTime: string, untilTime: string): boolean {
  const toSeconds = (t: string) => {
    const [h, m, s] = t.split(":").map(Number);
    return h * 3600 + m * 60 + (s || 0);
  };

  const inputSeconds = parseTimeToSeconds(inputTime);
  if (inputSeconds === null) return false;
  if (untilTime == null) return true;

  const untilTotal = toSeconds(untilTime);

  return inputSeconds <= untilTotal;
}

export function isTimeBetweenAndValid(
  inputTime: string,
  start: string,
  end: string
): boolean {
  const toSeconds = (t: string) => {
    const [h, m, s] = t.split(":").map(Number);
    return h * 3600 + m * 60 + (s || 0);
  };

  const inputSeconds = parseTimeToSeconds(inputTime);
  if (inputSeconds === null) return false;

  const startSeconds = toSeconds(start);
  const endSeconds = toSeconds(end);

  if (startSeconds < endSeconds) {
    return inputSeconds >= startSeconds && inputSeconds <= endSeconds;
  } else {
    return inputSeconds >= startSeconds || inputSeconds <= endSeconds;
  }
}

export const localeMap = {
  en: enUS,
  pt: pt,
  es: es,
};

export function formatTime(timeStr: string, locale: string) {
  const date = new Date(`1970-01-01T${timeStr}`);
  return format(date, "h:mm BBBB", {
    locale: localeMap[locale as keyof typeof localeMap],
  }).toLowerCase().replace(":00", "");
}