import { promises as fs } from "fs";
import path from "path";
import type { Booking, BookingDraft, CalendarSync } from "@/types/booking";
import { getStorageMode } from "@/lib/env-validation";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isValidEmail } from "./slots";

const bookingsFile = path.join(process.cwd(), "data", "bookings.json");
const storageNotConfiguredMessage =
  "Booking storage is not configured. Please contact Mahesh.";

type BookingRow = {
  id: string;
  name: string;
  email: string;
  notes: string | null;
  start_time: string;
  end_time: string;
  timezone: string;
  created_at: string;
};

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

function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    notes: row.notes || "",
    slotStart: row.start_time,
    slotEnd: row.end_time,
    timezone: row.timezone,
    createdAt: row.created_at
  };
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

async function readLocalBookings(): Promise<Booking[]> {
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
  const storageMode = getStorageMode();

  if (storageMode === "supabase") {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase!
      .from("bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? rowToBooking(data as BookingRow) : null;
  }

  if (storageMode === "not-configured") {
    throw new Error(storageNotConfiguredMessage);
  }

  const bookings = await readLocalBookings();
  return bookings.find((booking) => booking.id === id) || null;
}

export async function readBookings(): Promise<Booking[]> {
  const storageMode = getStorageMode();

  if (storageMode === "supabase") {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase!
      .from("bookings")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data || []) as BookingRow[]).map(rowToBooking);
  }

  if (storageMode === "not-configured") {
    throw new Error(storageNotConfiguredMessage);
  }

  return readLocalBookings();
}

export async function readBookingsInRange(
  rangeStartIso: string,
  rangeEndIso: string
): Promise<Booking[]> {
  const storageMode = getStorageMode();

  if (storageMode === "supabase") {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase!
      .from("bookings")
      .select("*")
      .gte("start_time", rangeStartIso)
      .lt("start_time", rangeEndIso)
      .order("start_time", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data || []) as BookingRow[]).map(rowToBooking);
  }

  if (storageMode === "not-configured") {
    throw new Error(storageNotConfiguredMessage);
  }

  const bookings = await readLocalBookings();

  return bookings.filter(
    (booking) =>
      booking.slotStart >= rangeStartIso && booking.slotStart < rangeEndIso
  );
}

async function createLocalBooking(
  validatedDraft: ValidatedBookingDraft
): Promise<Booking> {
  const bookings = await readLocalBookings();
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

export async function createBooking(draft: BookingDraft): Promise<Booking> {
  const validatedDraft = validateBookingDraft(draft);
  const storageMode = getStorageMode();

  if (storageMode === "supabase") {
    const supabase = getSupabaseServerClient();
    const { data: existingBooking, error: lookupError } = await supabase!
      .from("bookings")
      .select("id")
      .eq("start_time", validatedDraft.slotStart)
      .maybeSingle();

    if (lookupError) {
      throw new Error(lookupError.message);
    }

    if (existingBooking) {
      throw new Error("This time slot was just booked. Please choose another time.");
    }

    const { data, error } = await supabase!
      .from("bookings")
      .insert({
        id: validatedDraft.id,
        name: validatedDraft.name,
        email: validatedDraft.email,
        notes: validatedDraft.notes,
        start_time: validatedDraft.slotStart,
        end_time: validatedDraft.slotEnd,
        timezone: validatedDraft.timezone,
        created_at: validatedDraft.createdAt
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("This time slot was just booked. Please choose another time.");
      }

      throw new Error(error.message);
    }

    return rowToBooking(data as BookingRow);
  }

  if (storageMode === "not-configured") {
    throw new Error(storageNotConfiguredMessage);
  }

  return createLocalBooking(validatedDraft);
}

export async function updateBookingCalendarSync(
  bookingId: string,
  calendarSync: CalendarSync
): Promise<Booking | null> {
  if (getStorageMode() !== "local-json") {
    return findBooking(bookingId);
  }

  const bookings = await readLocalBookings();
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
