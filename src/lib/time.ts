import { addDays, format, startOfWeek, subDays } from "date-fns";

import type { PeriodKeys, Profile } from "@/lib/types";

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timezone: string) {
  if (!formatterCache.has(timezone)) {
    formatterCache.set(
      timezone,
      new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    );
  }

  return formatterCache.get(timezone)!;
}

function createPseudoDate(year: number, month: number, day: number) {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function getZonedCalendarParts(date: Date, timezone: string) {
  const parts = getFormatter(timezone).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const hour = pick("hour");

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour: hour === 24 ? 0 : hour,
  };
}

export function getPeriodKeys(date: Date, profile: Profile): PeriodKeys {
  const parts = getZonedCalendarParts(date, profile.timezone);
  let logicalDate = createPseudoDate(parts.year, parts.month, parts.day);

  if (parts.hour < profile.resetHourLocal) {
    logicalDate = subDays(logicalDate, 1);
  }

  const weekStart = startOfWeek(logicalDate, {
    weekStartsOn: profile.weekStartsOn,
  });

  return {
    dailyKey: format(logicalDate, "yyyy-MM-dd"),
    weekKey: format(weekStart, "yyyy-MM-dd"),
    monthKey: format(logicalDate, "yyyy-MM"),
    yearKey: format(logicalDate, "yyyy"),
    logicalDate,
    weekStart,
    weekday: logicalDate.getDay(),
  };
}

export function getWeekDates(weekStart: Date) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function getShiftedWeekStart(
  profile: Profile,
  baseDate: Date,
  weekOffset: number,
) {
  const { weekStart } = getPeriodKeys(baseDate, profile);
  return addDays(weekStart, weekOffset * 7);
}

export function formatResetHour(hour: number) {
  const normalized = ((hour % 24) + 24) % 24;
  const suffix = normalized >= 12 ? "PM" : "AM";
  const displayHour = normalized % 12 || 12;

  return `${displayHour}:00 ${suffix}`;
}

export function formatLogicalDate(date: Date) {
  return format(date, "EEE, d MMM yyyy");
}

export function formatCalendarDate(date: Date) {
  return format(date, "d MMM");
}

export function formatLongWeekday(date: Date) {
  return format(date, "EEEE");
}

export function formatShortWeekday(date: Date) {
  return format(date, "EEE");
}
