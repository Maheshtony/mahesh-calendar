import { NextResponse } from "next/server";
import {
  createGoogleCalendarEvent,
  isGoogleCalendarSlotBusy,
  readGoogleCalendarBooking
} from "@/lib/google-calendar";
import {
  createBooking,
  findBooking,
  readBookings,
  updateBookingCalendarSync,
  validateBookingDraft
} from "@/lib/storage";
import { getGoogleCalendarEnvStatus, isProduction } from "@/lib/env-validation";
import type { BookingDraft } from "@/types/booking";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const googleConfigured = getGoogleCalendarEnvStatus().configured;

  if (id) {
    const booking = googleConfigured
      ? await readGoogleCalendarBooking(id)
      : await findBooking(id);

    if (!booking) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({ booking });
  }

  if (googleConfigured || isProduction()) {
    return NextResponse.json({ bookings: [] });
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
    const draft = {
      slotStart: body.slotStart,
      slotEnd: body.slotEnd,
      timezone: body.timezone || "Local timezone",
      name: body.name,
      email: body.email,
      notes: body.notes || ""
    };
    const googleConfigured = getGoogleCalendarEnvStatus().configured;

    if (!googleConfigured) {
      if (isProduction()) {
        return NextResponse.json(
          {
            message: "Calendar booking is not configured. Please contact Mahesh."
          },
          { status: 503 }
        );
      }

      const booking = await createBooking(draft);
      const calendarSync = {
        status: "skipped" as const,
        message: "Local development JSON fallback was used."
      };
      const syncedBooking =
        (await updateBookingCalendarSync(booking.id, calendarSync)) || booking;

      return NextResponse.json(
        { booking: syncedBooking, calendarSync },
        { status: 201 }
      );
    }

    const booking = validateBookingDraft(draft);
    const slotBusy = await isGoogleCalendarSlotBusy(
      booking.slotStart,
      booking.slotEnd
    );

    if (slotBusy) {
      return NextResponse.json(
        {
          message: "This time slot was just booked. Please choose another time."
        },
        { status: 409 }
      );
    }

    const calendarSync = await createGoogleCalendarEvent(booking);

    if (calendarSync.status !== "created" || !calendarSync.eventId) {
      return NextResponse.json(
        {
          message: "Unable to create the calendar booking. Please try again."
        },
        { status: 502 }
      );
    }
    const syncedBooking = {
      ...booking,
      id: calendarSync.eventId,
      calendarSync
    };

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
