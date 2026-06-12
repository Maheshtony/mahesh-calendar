import { NextResponse } from "next/server";
import { sendBookingConfirmationEmails } from "@/lib/email";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import {
  createBooking,
  findBooking,
  readBookings,
  updateBookingCalendarSync
} from "@/lib/storage";
import type { BookingDraft } from "@/types/booking";

const storageNotConfiguredMessage =
  "Booking storage is not configured. Please contact Mahesh.";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const booking = await findBooking(id);

      if (!booking) {
        return NextResponse.json({ message: "Booking not found." }, { status: 404 });
      }

      return NextResponse.json({ booking });
    }

    const bookings = await readBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : storageNotConfiguredMessage
      },
      {
        status:
          error instanceof Error &&
          error.message === storageNotConfiguredMessage
            ? 503
            : 500
      }
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as BookingDraft;

  if (!body.name || !body.email || !body.slotStart || !body.slotEnd) {
    return NextResponse.json(
      { message: "Name, email, and selected time slot are required." },
      { status: 400 }
    );
  }

  try {
    const draft = {
      slotStart: body.slotStart,
      slotEnd: body.slotEnd,
      timezone: body.timezone || "Local timezone",
      name: body.name,
      email: body.email,
      notes: body.notes || ""
    };
    const booking = await createBooking(draft);
    const calendarSync = await createGoogleCalendarEvent(booking);
    let syncedBooking = booking;

    try {
      syncedBooking =
        (await updateBookingCalendarSync(booking.id, calendarSync)) || booking;
    } catch (syncError) {
      console.error("[api/bookings] Calendar sync persistence failed", syncError);
    }

    const emailStatus = await sendBookingConfirmationEmails(syncedBooking);

    return NextResponse.json(
      { booking: syncedBooking, emailStatus },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create booking right now.";

    return NextResponse.json(
      { message },
      { status: message === storageNotConfiguredMessage ? 503 : 409 }
    );
  }
}
