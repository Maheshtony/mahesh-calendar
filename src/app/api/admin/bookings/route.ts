import { NextResponse } from "next/server";
import { readBookings } from "@/lib/storage";
import type { Booking } from "@/types/booking";

export const dynamic = "force-dynamic";

function getBookingBucket(booking: Booking) {
  if (booking.status === "cancelled") {
    return 1;
  }

  return Date.parse(booking.slotEnd) >= Date.now() ? 0 : 2;
}

function sortBookings(bookings: Booking[]) {
  return [...bookings].sort((a, b) => {
    const bucketDifference = getBookingBucket(a) - getBookingBucket(b);

    if (bucketDifference !== 0) {
      return bucketDifference;
    }

    if (getBookingBucket(a) === 0) {
      return a.slotStart.localeCompare(b.slotStart);
    }

    return b.slotStart.localeCompare(a.slotStart);
  });
}

function toAdminBooking(booking: Booking) {
  return {
    id: booking.id,
    name: booking.name,
    email: booking.email,
    notes: booking.notes,
    start_time: booking.slotStart,
    end_time: booking.slotEnd,
    timezone: booking.timezone,
    status: booking.status,
    created_at: booking.createdAt,
    cancelled_at: booking.cancelledAt || null,
    google_event_id: booking.googleEventId || null,
    google_event_html_link: booking.googleEventHtmlLink || null,
    calendar_sync_status: booking.calendarSyncStatus || null,
    calendar_synced_at: booking.calendarSyncedAt || null,
    cancel_token: booking.cancelToken || null
  };
}

export async function GET(request: Request) {
  const adminSecret = process.env.ADMIN_DASHBOARD_SECRET?.trim();

  if (!adminSecret) {
    return NextResponse.json(
      { error: "Admin dashboard is not configured." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);

  if (searchParams.get("secret") !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await readBookings();

  return NextResponse.json({
    bookings: sortBookings(bookings).map(toAdminBooking)
  });
}
