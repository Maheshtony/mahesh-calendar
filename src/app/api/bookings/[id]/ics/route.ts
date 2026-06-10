import { NextResponse } from "next/server";
import { findBooking } from "@/lib/storage";
import type { Booking } from "@/types/booking";

export const dynamic = "force-dynamic";

function formatIcsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(".000", "");
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function createDescription(booking: Booking) {
  return [
    `Client name: ${booking.name}`,
    `Client email: ${booking.email}`,
    `Notes: ${booking.notes || "None"}`,
    `Visitor timezone: ${booking.timezone}`
  ].join("\n");
}

function createIcsContent(booking: Booking) {
  const now = formatIcsDate(new Date().toISOString());
  const start = formatIcsDate(booking.slotStart);
  const end = formatIcsDate(booking.slotEnd);
  const description = escapeIcsText(createDescription(booking));

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mahesh Calendar//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(booking.id)}@mahesh-calendar`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    "SUMMARY:Meeting with Mahesh",
    `DESCRIPTION:${description}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Meeting with Mahesh starts in 30 minutes",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT10M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Meeting with Mahesh starts in 10 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const booking = await findBooking(id);

  if (!booking) {
    return NextResponse.json(
      { message: "Booking not found. Please return to the calendar." },
      { status: 404 }
    );
  }

  return new Response(createIcsContent(booking), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="mahesh-calendar-booking.ics"'
    }
  });
}
