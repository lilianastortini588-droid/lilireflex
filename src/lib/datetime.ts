import { site } from "./config";

export type ClockParts = {
  dateKey: string;
  time: string;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((item) => item.type === type)?.value ?? "";
}

export function nowInTimezone(date = new Date()): ClockParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: site.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);

  const dateKey = `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
  const time = `${part(parts, "hour")}:${part(parts, "minute")}`;
  const map: Record<string, ClockParts["weekday"]> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    dateKey,
    time,
    weekday: map[part(parts, "weekday")] ?? 0,
  };
}

export function addDays(dateKey: string, amount: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + amount));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

export function weekdayFromKey(dateKey: string): ClockParts["weekday"] {
  const [year, month, day] = dateKey.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day, 15));
  return nowInTimezone(probe).weekday;
}

export function isSlotPast(dateKey: string, time: string, now = nowInTimezone()): boolean {
  if (dateKey < now.dateKey) return true;
  if (dateKey > now.dateKey) return false;
  return time <= now.time;
}

export function slotKey(dateKey: string, time: string): string {
  return `${dateKey}T${time}`;
}
