import { promises as fs } from "fs";
import path from "path";
import type { Booking, BookingDraft, CalendarSync } from "@/types/booking";
import { getStorageMode } from "@/lib/env-validation";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isValidEmail, slotsOverlap } from "./slots";

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
  status?: "confirmed" | "cancelled";
  cancelled_at?: string | null;
  cancel_token?: string | null;
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
  cancelToken: string;
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
    status: row.status || "confirmed",
    cancelledAt: row.cancelled_at || undefined,
    cancelToken: row.cancel_token || undefined,
    createdAt: row.created_at
  };
}

function isConfirmedBooking(booking: Booking) {
  return (booking.status || "confirmed") === "confirmed";
}

export function validateBookingDraft(draft: BookingDraft): ValidatedBookingDraft {
  const name = draft.name.trim();
  const email = draft.email.trim();
  const timezone = draft.timezone.trim();
  const startTime = Date.parse(draft.slotStart);
  const endTime = Date.parse(draft.slotEnd);

  if (!name) {
    throw new Error("Name is required.");
  }

  if (!isValidEmail(email)) {
    throw new Error("Enter a valid email address.");
  }

  if (!draft.slotStart || !draft.slotEnd) {
    throw new Error("Select an available time slot.");
  }

  if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime <= startTime) {
    throw new Error("Select an available time slot.");
  }

  const durationMinutes = (endTime - startTime) / 60000;

  if (![30, 60].includes(durationMinutes)) {
    throw new Error("Select a 30-minute or 1-hour meeting duration.");
  }

  if (startTime <= Date.now()) {
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
    createdAt: new Date().toISOString(),
    cancelToken: crypto.randomUUID()
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
      .eq("status", "confirmed")
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
      isConfirmedBooking(booking) &&
      booking.slotStart >= rangeStartIso &&
      booking.slotStart < rangeEndIso
  );
}

async function createLocalBooking(
  validatedDraft: ValidatedBookingDraft
): Promise<Booking> {
  const bookings = await readLocalBookings();
  const slotTaken = bookings.some(
    (booking) =>
      isConfirmedBooking(booking) &&
      slotsOverlap(
        booking.slotStart,
        booking.slotEnd,
        validatedDraft.slotStart,
        validatedDraft.slotEnd
      )
  );

  if (slotTaken) {
    throw new Error("This time is already booked. Please choose another slot.");
  }

  const booking: Booking = {
    slotStart: validatedDraft.slotStart,
    slotEnd: validatedDraft.slotEnd,
    timezone: validatedDraft.timezone,
    name: validatedDraft.name,
    email: validatedDraft.email,
    notes: validatedDraft.notes,
    status: "confirmed",
    cancelToken: validatedDraft.cancelToken,
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
    const { data: existingBookings, error: lookupError } = await supabase!
      .from("bookings")
      .select("id")
      .eq("status", "confirmed")
      .lt("start_time", validatedDraft.slotEnd)
      .gt("end_time", validatedDraft.slotStart)
      .limit(1);

    if (lookupError) {
      throw new Error(lookupError.message);
    }

    if (existingBookings?.length) {
      throw new Error("This time is already booked. Please choose another slot.");
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
        status: "confirmed",
        cancel_token: validatedDraft.cancelToken,
        created_at: validatedDraft.createdAt
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("This time is already booked. Please choose another slot.");
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

export async function cancelBooking(
  bookingId: string,
  cancelToken: string
): Promise<{ booking: Booking; alreadyCancelled: boolean }> {
  const storageMode = getStorageMode();
  const cancelledAt = new Date().toISOString();

  if (storageMode === "supabase") {
    const supabase = getSupabaseServerClient();
    const { data: existingBooking, error: lookupError } = await supabase!
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("cancel_token", cancelToken)
      .maybeSingle();

    if (lookupError) {
      throw new Error(lookupError.message);
    }

    if (!existingBooking) {
      throw new Error("Booking not found or cancellation link is invalid.");
    }

    const booking = rowToBooking(existingBooking as BookingRow);

    if (booking.status === "cancelled") {
      return { booking, alreadyCancelled: true };
    }

    const { data, error } = await supabase!
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: cancelledAt
      })
      .eq("id", bookingId)
      .eq("cancel_token", cancelToken)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      booking: rowToBooking(data as BookingRow),
      alreadyCancelled: false
    };
  }

  if (storageMode === "not-configured") {
    throw new Error(storageNotConfiguredMessage);
  }

  const bookings = await readLocalBookings();
  const bookingIndex = bookings.findIndex(
    (booking) => booking.id === bookingId && booking.cancelToken === cancelToken
  );

  if (bookingIndex === -1) {
    throw new Error("Booking not found or cancellation link is invalid.");
  }

  if (bookings[bookingIndex].status === "cancelled") {
    return {
      booking: bookings[bookingIndex],
      alreadyCancelled: true
    };
  }

  bookings[bookingIndex] = {
    ...bookings[bookingIndex],
    status: "cancelled",
    cancelledAt
  };
  await writeLocalBookings(bookings);

  return {
    booking: bookings[bookingIndex],
    alreadyCancelled: false
  };
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
