"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MAHESH_TIMEZONE,
  MAHESH_TIMEZONE_LABEL,
  formatSlotRangeInTimeZone,
  getVisitorTimezone
} from "@/lib/slots";
import { useBookingStore } from "@/store/booking-store";
import type { Booking } from "@/types/booking";

function formatGoogleCalendarDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(".000", "");
}

function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

function getBookingLink(bookingId: string) {
  const appUrl = getAppUrl();

  return `${appUrl}/confirmation?id=${encodeURIComponent(bookingId)}`;
}

function getGoogleCalendarUrl(booking: Booking, clientTimezone: string) {
  const bookingLink = getBookingLink(booking.id);
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

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const confirmation = useBookingStore((state) => state.confirmation);
  const [booking, setBooking] = useState<Booking | null>(confirmation);
  const [timezone, setTimezone] = useState("Local timezone");
  const clientTimezone = booking?.timezone || timezone;

  useEffect(() => {
    setTimezone(getVisitorTimezone());
    const id = searchParams.get("id");

    if (!confirmation && id) {
      fetch(`/api/bookings?id=${id}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: { booking?: Booking } | null) => {
          if (payload?.booking) {
            setBooking(payload.booking);
          }
        })
        .catch(() => undefined);
    }
  }, [confirmation, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist p-6">
      <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-xl">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-ocean">
          Booking confirmed
        </p>
        <h1 className="mt-3 text-4xl font-black text-ink">Mahesh Calendar</h1>
        {booking ? (
          <div className="mt-6 space-y-3 text-slate-700">
            <p>
              Thanks, <strong>{booking.name}</strong>. Your meeting request has
              been booked.
            </p>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-500">
                Your selected time:
              </p>
              <p className="mt-1 font-extrabold text-ink">
                {formatSlotRangeInTimeZone(
                  booking.slotStart,
                  booking.slotEnd,
                  clientTimezone
                )}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-500">
                Mahesh calendar time:
              </p>
              <p className="mt-1 font-extrabold text-ink">
                {formatSlotRangeInTimeZone(
                  booking.slotStart,
                  booking.slotEnd,
                  MAHESH_TIMEZONE,
                  MAHESH_TIMEZONE_LABEL
                )}
              </p>
            </div>
            <p className="rounded-md bg-[#e7f5f7] p-4 text-sm font-bold text-ocean">
              Visitor timezone: {clientTimezone}
            </p>
            <p className="rounded-md bg-[#eef8fa] p-4 text-sm font-bold leading-6 text-ocean">
              Timezone handled automatically. Book in your local time; Mahesh
              will see the correct time in IST.
            </p>
            <p className="rounded-md bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              Booking saved successfully.
            </p>
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <a
                href={getGoogleCalendarUrl(booking, clientTimezone)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex justify-center rounded-md bg-ocean px-5 py-3 text-center font-bold text-white transition hover:bg-[#166474]"
              >
                Add to Google Calendar
              </a>
              <a
                href={`/api/bookings/${booking.id}/ics`}
                className="inline-flex justify-center rounded-md border border-slate-200 bg-white px-5 py-3 text-center font-bold text-ink transition hover:border-ocean hover:bg-[#f7fbfc]"
              >
                Download Calendar Invite
              </a>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-slate-700">
            Your meeting request has been booked. Return to the calendar to view
            more available times.
          </p>
        )}
        <div className="mt-8">
          <Link
            href="/calendar"
            className="inline-flex rounded-md border border-slate-200 bg-white px-5 py-3 font-bold text-ink transition hover:border-ocean hover:bg-[#f7fbfc]"
          >
            Back to Calendar
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-mist p-6">
          <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-ocean">
              Booking confirmed
            </p>
            <h1 className="mt-3 text-4xl font-black text-ink">
              Mahesh Calendar
            </h1>
          </section>
        </main>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
