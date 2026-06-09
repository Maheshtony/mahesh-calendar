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
import type { Booking, CalendarSync } from "@/types/booking";

function getCalendarSyncLabel(calendarSync?: CalendarSync) {
  if (!calendarSync) {
    return {
      label: "Google Calendar sync: skipped because not configured",
      className: "bg-slate-50 text-slate-700"
    };
  }

  if (calendarSync.status === "created") {
    return {
      label: "Google Calendar sync: configured and created",
      className: "bg-emerald-50 text-emerald-700"
    };
  }

  if (calendarSync.status === "failed") {
    return {
      label: "Google Calendar sync: failed",
      className: "bg-red-50 text-red-700"
    };
  }

  return {
    label: "Google Calendar sync: skipped because not configured",
    className: "bg-slate-50 text-slate-700"
  };
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const confirmation = useBookingStore((state) => state.confirmation);
  const [booking, setBooking] = useState<Booking | null>(confirmation);
  const [timezone, setTimezone] = useState("Local timezone");
  const calendarSyncLabel = getCalendarSyncLabel(booking?.calendarSync);
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
            <p
              className={`rounded-md p-4 text-sm font-bold ${calendarSyncLabel.className}`}
            >
              {calendarSyncLabel.label}
            </p>
            <p>A confirmation can be sent to {booking.email}.</p>
          </div>
        ) : (
          <p className="mt-6 text-slate-700">
            Your meeting request has been booked. Return to the calendar to view
            more available times.
          </p>
        )}
        <Link
          href="/calendar"
          className="mt-8 inline-flex rounded-md bg-ocean px-5 py-3 font-bold text-white transition hover:bg-[#166474]"
        >
          Back to Calendar
        </Link>
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
