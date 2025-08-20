import { clsx, type ClassValue } from "clsx"
import { format } from "date-fns/format";
import { enUS, es, pt } from "date-fns/locale";
import { twMerge } from "tailwind-merge"
import { addHours, subDays, isBefore, min as minDate } from "date-fns";
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

export function generateReservationID() {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const timestamp = Date.now().toString(36).toUpperCase();
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return `${timestamp}-${randomPart}`;
}

type Options = {
  bookingAt: Date;   // instante da reserva (UTC ou com TZ aplicado)
  checkInAt: Date;
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
};

export function buildCancellationMessage({
  bookingAt,
  checkInAt,
  locale,
  t
}: Options): string {
  const now = new Date();

  const freeUntilBy48h = addHours(bookingAt, 48);
  const freeUntilBy14d = subDays(checkInAt, 14);
  const freeUntil = minDate([freeUntilBy48h, freeUntilBy14d]);

  const partialUntil = subDays(checkInAt, 7);

  const fmtTimeDate = (d: Date) => {
    if (locale === "pt") {
      return `${format(d, "HH:mm", { locale: localeMap[locale as keyof typeof localeMap] })} de ${format(
        d,
        "d 'de' MMM",
        { locale: localeMap[locale as keyof typeof localeMap] }
      )}`;
    }
    if (locale === "es") {
      return `${format(d, "HH:mm", { locale: localeMap[locale as keyof typeof localeMap] })} del ${format(
        d,
        "d 'de' MMM",
        { locale: localeMap[locale as keyof typeof localeMap] }
      )}`;
    }
    return `${format(d, "p", { locale: localeMap[locale as keyof typeof localeMap] })} on ${format(d, "MMM d", { locale: localeMap[locale as keyof typeof localeMap] })}`;
  };



  const parts: string[] = [];

  if (isBefore(now, freeUntil)) {
    parts.push(t("free"));
  }

  if (isBefore(now, partialUntil)) {
    const deadline = partialUntil;
    parts.push(
      t("partial", { deadline: fmtTimeDate(deadline) })
    );
  } else {
    parts.push(t("afterPartial"));
  }

  return parts.join(" ");
}

function getRandomNumber(limit: number): number {
  return Math.floor(Math.random() * limit);
}

function filterSymbols(excludeSymbols: string[], group: string): string {
  let newGroup = group;
  excludeSymbols.forEach((symbol) => {
    newGroup = newGroup.replace(new RegExp(symbol, 'g'), '');
  });
  return newGroup;
}

function createId(availableChars: string[], idLength: number): string {
  let id = '';
  for (let i = 0; i < idLength; i++) {
    id += availableChars[getRandomNumber(availableChars.length)];
  }
  return id;
}

interface GenerateUniqueIdOptions {
  length?: number;
  useLetters?: boolean;
  useNumbers?: boolean;
  includeSymbols?: string[];
  excludeSymbols?: string[];
}

export function generateUniqueId({
  length = 20,
  useLetters = true,
  useNumbers = true,
  includeSymbols = [],
  excludeSymbols = [],
}: GenerateUniqueIdOptions = {}): string {
  let letters = 'abcdefghijklmnopqrstuvwxyz';
  let numbers = '0123456789';
  let availableChars: string[] = [];
  let lettersArr: string[] = [];
  let numbersArr: string[] = [];

  if (useLetters) {
    if (excludeSymbols.length) letters = filterSymbols(excludeSymbols, letters);
    lettersArr = letters.split('');
  }

  if (useNumbers) {
    if (excludeSymbols.length) numbers = filterSymbols(excludeSymbols, numbers);
    numbersArr = numbers.split('');
  }

  availableChars = [...lettersArr, ...numbersArr, ...includeSymbols];

  return createId(availableChars, length);
}