import { NextResponse } from "next/server";
import { getGoogleCalendarEnvStatus, isProduction } from "@/lib/env-validation";
import { readGoogleCalendarBusyEvents } from "@/lib/google-calendar";
import { generateSlotsFromBusyRanges } from "@/lib/slots";
import { readBookings } from "@/lib/storage";

export const dynamic = "force-dynamic";

function getRange() {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 21);

  return {
    start: now.toISOString(),
    end: end.toISOString()
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const visitorTimezone =
    searchParams.get("timezone") || "Local timezone";
  const range = getRange();
  const googleConfigured = getGoogleCalendarEnvStatus().configured;

  if (googleConfigured) {
    const busyRanges = await readGoogleCalendarBusyEvents(range.start, range.end);

    return NextResponse.json({
      source: "google-calendar",
      message: "Availability is loaded from Mahesh Google Calendar.",
      slots: generateSlotsFromBusyRanges(busyRanges, visitorTimezone)
    });
  }

  if (isProduction()) {
    return NextResponse.json(
      {
        source: "not-configured",
        message: "Calendar booking is not configured. Please contact Mahesh.",
        slots: []
      },
      { status: 503 }
    );
  }

  const bookings = await readBookings();
  const busyRanges = bookings.map((booking) => ({
    start: booking.slotStart,
    end: booking.slotEnd
  }));

  return NextResponse.json({
    source: "local-json",
    message:
      "Local development fallback is active. Configure Google Calendar for production.",
    slots: generateSlotsFromBusyRanges(busyRanges, visitorTimezone)
  });
}
