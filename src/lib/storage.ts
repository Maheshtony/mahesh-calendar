import { promises as fs } from "fs";
import path from "path";
import type { Booking, BookingDraft, CalendarSync } from "@/types/booking";
import { isValidEmail } from "./slots";

const bookingsFile = path.join(process.cwd(), "data", "bookings.json");

type ValidatedBookingDraft = {
  id: string;
  slotStart: string;
  slotEnd: string;
  timezone: string;
  name: string;
  email: string;
  notes: string;
  createdAt: string;
};

async function ensureStorageFile() {
  await fs.mkdir(path.dirname(bookingsFile), { recursive: true });

  try {
    await fs.access(bookingsFile);
  } catch {
    await fs.writeFile(bookingsFile, "[]", "utf8");
  }
}

export function validateBookingDraft(draft: BookingDraft): ValidatedBookingDraft {
  const name = draft.name.trim();
  const email = draft.email.trim();
  const timezone = draft.timezone.trim();

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!isValidEmail(email)) {
    throw new Error("Enter a valid email address.");
  }

  if (!draft.slotStart || !draft.slotEnd) {
    throw new Error("Select an available time slot.");
  }

  if (
    Number.isNaN(Date.parse(draft.slotStart)) ||
    Date.parse(draft.slotStart) <= Date.now()
  ) {
    throw new Error("Select a future time slot.");
  }

  return {
    slotStart: new Date(draft.slotStart).toISOString(),
    slotEnd: new Date(draft.slotEnd).toISOString(),
    timezone,
    name,
    email,
    notes: draft.notes.trim(),
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
}

export async function readBookings(): Promise<Booking[]> {
  await ensureStorageFile();
  const content = await fs.readFile(bookingsFile, "utf8");

  try {
    return JSON.parse(content) as Booking[];
  } catch {
    return [];
  }
}

async function writeLocalBookings(bookings: Booking[]) {
  await fs.writeFile(bookingsFile, JSON.stringify(bookings, null, 2), "utf8");
}

export async function findBooking(id: string): Promise<Booking | null> {
  const bookings = await readBookings();
  return bookings.find((booking) => booking.id === id) || null;
}

export async function createBooking(draft: BookingDraft): Promise<Booking> {
  const validatedDraft = validateBookingDraft(draft);
  const bookings = await readBookings();
  const slotTaken = bookings.some(
    (booking) => booking.slotStart === validatedDraft.slotStart
  );

  if (slotTaken) {
    throw new Error("This slot has already been booked.");
  }

  const booking: Booking = {
    slotStart: validatedDraft.slotStart,
    slotEnd: validatedDraft.slotEnd,
    timezone: validatedDraft.timezone,
    name: validatedDraft.name,
    email: validatedDraft.email,
    notes: validatedDraft.notes,
    id: validatedDraft.id,
    createdAt: validatedDraft.createdAt
  };

  bookings.push(booking);
  await writeLocalBookings(bookings);

  return booking;
}

export async function updateBookingCalendarSync(
  bookingId: string,
  calendarSync: CalendarSync
): Promise<Booking | null> {
  const bookings = await readBookings();
  const bookingIndex = bookings.findIndex((booking) => booking.id === bookingId);

  if (bookingIndex === -1) {
    return null;
  }

  bookings[bookingIndex] = {
    ...bookings[bookingIndex],
    calendarSync
  };

  await writeLocalBookings(bookings);

  return bookings[bookingIndex];
}
