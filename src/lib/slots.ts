import {
  addDays,
  addMinutes,
  endOfDay,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay
} from "date-fns";
import type { Booking, Slot } from "@/types/booking";

const SLOT_MINUTES = 30;
const DAYS_TO_SHOW = 21;
export const MAHESH_TIMEZONE = "Asia/Calcutta";
export const MAHESH_TIMEZONE_LABEL = "IST";

export function getVisitorTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local timezone";
}

export function formatSlotTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(iso));
}

function getFormatterTimeZone(timeZone: string) {
  return timeZone && timeZone !== "Local timezone" ? timeZone : undefined;
}

function getShortTimeZoneName(iso: string, timeZone: string) {
  const formatterTimeZone = getFormatterTimeZone(timeZone);

  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZone: formatterTimeZone,
      timeZoneName: "short"
    }).formatToParts(new Date(iso));

    return parts.find((part) => part.type === "timeZoneName")?.value || "";
  } catch {
    return "";
  }
}

export function formatSlotRangeInTimeZone(
  startIso: string,
  endIso: string,
  timeZone: string,
  timeZoneLabel?: string
) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const formatterTimeZone = getFormatterTimeZone(timeZone);
  const date = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: formatterTimeZone
  }).format(start);
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: formatterTimeZone
  });
  const zoneName =
    timeZoneLabel || getShortTimeZoneName(startIso, timeZone) || timeZone;
  const zoneText =
    timeZoneLabel || timeZone === zoneName ? zoneName : `${zoneName} (${timeZone})`;

  return `${date}, ${timeFormatter.format(start)} - ${timeFormatter.format(
    end
  )} ${zoneText}`;
}

export function slotsOverlap(
  firstStartIso: string,
  firstEndIso: string,
  secondStartIso: string,
  secondEndIso: string
) {
  return (
    Date.parse(firstStartIso) < Date.parse(secondEndIso) &&
    Date.parse(firstEndIso) > Date.parse(secondStartIso)
  );
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
}

export function formatTimeOnlyInTimeZone(
  iso: string,
  timeZone: string,
  timeZoneLabel?: string
) {
  const formatterTimeZone = getFormatterTimeZone(timeZone);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: formatterTimeZone
  }).format(new Date(iso));

  return timeZoneLabel ? `${time} ${timeZoneLabel}` : time;
}

export function formatDateLabel(date: Date) {
  return format(date, "EEEE, MMMM d");
}

export function formatDurationLabel(startIso: string, endIso: string) {
  const minutes = Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000
  );

  return minutes === 60 ? "1 hour" : `${minutes} minutes`;
}

export function generateSlots(bookings: Booking[]): Slot[] {
  return generateSlotsFromBusyRanges(
    bookings.map((booking) => ({
      start: booking.slotStart,
      end: booking.slotEnd
    })),
    getVisitorTimezone()
  );
}

export function generateSlotsFromBusyRanges(
  busyRanges: Array<{ start: string; end: string }>,
  visitorTimezone: string
): Slot[] {
  const now = new Date();
  const rangeStart = startOfDay(now);
  const rangeEnd = addDays(rangeStart, DAYS_TO_SHOW);

  return generateSlotsForRange(
    busyRanges,
    visitorTimezone,
    rangeStart.toISOString(),
    rangeEnd.toISOString()
  );
}

export function generateSlotsForRange(
  busyRanges: Array<{ start: string; end: string }>,
  visitorTimezone: string,
  rangeStartIso: string,
  rangeEndIso: string
): Slot[] {
  const now = new Date();
  const rangeEnd = new Date(rangeEndIso);
  let cursor = new Date(rangeStartIso);
  const slots: Slot[] = [];

  while (isBefore(cursor, rangeEnd)) {
    const start = new Date(cursor);
    const end = addMinutes(start, SLOT_MINUTES);
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    if (isAfter(start, now) && !isAfter(end, rangeEnd)) {
      const available = !busyRanges.some((busyRange) =>
        slotsOverlap(startIso, endIso, busyRange.start, busyRange.end)
      );

      slots.push({
        id: startIso,
        start: startIso,
        start_time: startIso,
        end: endIso,
        end_time: endIso,
        localDisplay: formatTimeOnlyInTimeZone(startIso, visitorTimezone),
        maheshDisplay: formatTimeOnlyInTimeZone(
          startIso,
          MAHESH_TIMEZONE,
          MAHESH_TIMEZONE_LABEL
        ),
        localDisplayTime: formatSlotRangeInTimeZone(
          startIso,
          endIso,
          visitorTimezone
        ),
        maheshDisplayTime: formatSlotRangeInTimeZone(
          startIso,
          endIso,
          MAHESH_TIMEZONE,
          MAHESH_TIMEZONE_LABEL
        ),
        available
      });
    }

    cursor = end;
  }

  return slots;
}

export function getSlotsForDay(slots: Slot[], date: Date) {
  const boundary = endOfDay(date);

  return slots
    .filter((slot) => {
      const slotDate = new Date(slot.start);
      return isSameDay(slotDate, date) && isBefore(slotDate, boundary);
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}
