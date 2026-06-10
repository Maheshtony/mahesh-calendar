"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getAppUrl,
  getCancelLink,
  getGoogleCalendarUrl
} from "@/lib/calendar-links";
import {
  MAHESH_TIMEZONE,
  MAHESH_TIMEZONE_LABEL,
  formatSlotRangeInTimeZone,
  getVisitorTimezone
} from "@/lib/slots";
import { useBookingStore } from "@/store/booking-store";
import type { Booking } from "@/types/booking";

function getEmailStatusMessage(status: string | null) {
  if (status === "sent") {
    return "Email confirmation sent.";
  }

  if (status === "failed") {
    return "Email confirmation could not be sent.";
  }

  if (status === "skipped") {
    return "Email confirmation skipped because email is not configured.";
  }

  return "";
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const confirmation = useBookingStore((state) => state.confirmation);
  const [booking, setBooking] = useState<Booking | null>(confirmation);
  const [timezone, setTimezone] = useState("Local timezone");
  const emailStatusMessage = getEmailStatusMessage(
    searchParams.get("emailStatus")
  );
  const clientTimezone = booking?.timezone || timezone;
  const appUrl =
    typeof window !== "undefined" ? getAppUrl(window.location.origin) : "";

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
            {emailStatusMessage ? (
              <p className="rounded-md bg-slate-50 p-4 text-sm font-bold text-slate-700">
                {emailStatusMessage}
              </p>
            ) : null}
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <a
                href={getGoogleCalendarUrl(booking, clientTimezone, appUrl)}
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
            {booking.cancelToken ? (
              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-500">
                  Need to cancel?
                </p>
                <a
                  href={getCancelLink(booking, appUrl)}
                  className="mt-3 inline-flex rounded-md border border-slate-200 bg-white px-5 py-3 font-bold text-ink transition hover:border-ocean hover:bg-[#f7fbfc]"
                >
                  Cancel Booking
                </a>
              </div>
            ) : null}
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
