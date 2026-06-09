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

export function getVisitorTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local timezone";
}

export function formatSlotTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(iso));
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

export function formatDateLabel(date: Date) {
  return format(date, "EEEE, MMMM d");
}

export function generateSlots(bookings: Booking[]): Slot[] {
  const bookedStarts = new Set(bookings.map((booking) => booking.slotStart));
  const now = new Date();
  const slots: Slot[] = [];

  for (let dayOffset = 0; dayOffset < DAYS_TO_SHOW; dayOffset += 1) {
    const day = addDays(startOfDay(now), dayOffset);

    for (let hour = 0; hour < 24; hour += 1) {
      for (const minute of [0, 30]) {
        const start = new Date(day);
        start.setHours(hour, minute, 0, 0);
        const end = addMinutes(start, SLOT_MINUTES);
        const startIso = start.toISOString();

        if (!isAfter(start, now)) {
          continue;
        }

        slots.push({
          id: startIso,
          start: startIso,
          end: end.toISOString(),
          available: !bookedStarts.has(startIso)
        });
      }
    }
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
