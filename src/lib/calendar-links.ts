import type { Booking } from "@/types/booking";

export function formatGoogleCalendarDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(".000", "");
}

export function getAppUrl(fallbackUrl = "") {
  return (process.env.NEXT_PUBLIC_APP_URL || fallbackUrl).replace(/\/$/, "");
}

export function getBookingLink(bookingId: string, appUrl = getAppUrl()) {
  return `${appUrl}/confirmation?id=${encodeURIComponent(bookingId)}`;
}

export function getCancelLink(booking: Booking, appUrl = getAppUrl()) {
  if (!booking.cancelToken) {
    return "";
  }

  return `${appUrl}/cancel?id=${encodeURIComponent(
    booking.id
  )}&token=${encodeURIComponent(booking.cancelToken)}`;
}

export function getIcsLink(bookingId: string, appUrl = getAppUrl()) {
  return `${appUrl}/api/bookings/${encodeURIComponent(bookingId)}/ics`;
}

export function getGoogleCalendarUrl(
  booking: Booking,
  clientTimezone: string,
  appUrl = getAppUrl()
) {
  const bookingLink = getBookingLink(booking.id, appUrl);
  const details = [
    `Client name: ${booking.name}`,
    `Client email: ${booking.email}`,
    `Notes: ${booking.notes || "None"}`,
    `Visitor timezone: ${clientTimezone}`,
    `Mahesh Calendar booking link: ${bookingLink}`
  ].join("\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Meeting with Mahesh",
    dates: `${formatGoogleCalendarDate(
      booking.slotStart
    )}/${formatGoogleCalendarDate(booking.slotEnd)}`,
    details,
    ctz: clientTimezone
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
