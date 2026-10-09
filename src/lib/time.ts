import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const APP_TIME_ZONE = "America/New_York";

/** Parse an HTML date/datetime value as New York wall-clock time. */
export function fromNewYorkTime(value: string): Date {
  return fromZonedTime(value, APP_TIME_ZONE);
}

export function newYorkDateKey(value: Date = new Date()): string {
  return formatInTimeZone(value, APP_TIME_ZONE, "yyyy-MM-dd");
}

export function isSameTradingDay(value: Date, reference: Date = new Date(), timeZone = APP_TIME_ZONE): boolean {
  return formatInTimeZone(value, timeZone, "yyyy-MM-dd") === formatInTimeZone(reference, timeZone, "yyyy-MM-dd");
}

export function newYorkDateTimeValue(value: Date = new Date()): string {
  return formatInTimeZone(value, APP_TIME_ZONE, "yyyy-MM-dd'T'HH:mm");
}

export function newYorkTimeValue(value: Date = new Date()): string {
  return formatInTimeZone(value, APP_TIME_ZONE, "HH:mm");
}

export function formatNewYorkDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeZone: APP_TIME_ZONE }).format(value);
}

export function formatNewYorkDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeStyle: "short", timeZone: APP_TIME_ZONE }).format(value);
}

/** Format a database date-only value without applying a timezone conversion. */
export function formatDateOnly(value: Date): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeZone: "UTC" }).format(value);
}

/** Return the YYYY-MM-DD value of a database date-only field without conversion. */
export function dateOnlyValue(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function newYorkDayStart(value: string): Date {
  return fromNewYorkTime(`${value}T00:00:00`);
}

export function newYorkDayEnd(value: string): Date {
  return fromNewYorkTime(`${value}T23:59:59.999`);
}
