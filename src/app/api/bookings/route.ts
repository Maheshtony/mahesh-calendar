import { NextResponse } from "next/server";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";
import {
  createBooking,
  findBooking,
  readBookings,
  updateBookingCalendarSync
} from "@/lib/storage";
import type { BookingDraft } from "@/types/booking";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const booking = await findBooking(id);

    if (!booking) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({ booking });
  }

  const bookings = await readBookings();
  return NextResponse.json({ bookings });
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
    const booking = await createBooking({
      slotStart: body.slotStart,
      slotEnd: body.slotEnd,
      timezone: body.timezone || "Local timezone",
      name: body.name,
      email: body.email,
      notes: body.notes || ""
    });
    const calendarSync = await createGoogleCalendarEvent(booking);
    const syncedBooking =
      (await updateBookingCalendarSync(booking.id, calendarSync)) || booking;

    return NextResponse.json(
      { booking: syncedBooking, calendarSync },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create booking right now."
      },
      { status: 409 }
    );
  }
}
