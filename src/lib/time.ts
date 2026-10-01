import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const APP_TIME_ZONE = "America/New_York";

/** Parse an HTML date/datetime value as New York wall-clock time. */
export function fromNewYorkTime(value: string): Date {
  return fromZonedTime(value, APP_TIME_ZONE);
}

export function newYorkDateKey(value: Date = new Date()): string {
  return formatInTimeZone(value, APP_TIME_ZONE, "yyyy-MM-dd");
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

export function newYorkDayStart(value: string): Date {
  return fromNewYorkTime(`${value}T00:00:00`);
}

export function newYorkDayEnd(value: string): Date {
  return fromNewYorkTime(`${value}T23:59:59.999`);
}
