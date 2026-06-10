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
  formatDurationLabel,
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
    return "Email confirmation is not enabled yet.";
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
    <main className="flex min-h-screen items-center justify-center bg-[#f3f8f6] p-4 md:p-6">
      <section className="w-full max-w-3xl rounded-lg border border-emerald-100 bg-white p-5 shadow-xl md:p-8">
        {booking ? (
          <div className="space-y-6 text-slate-700">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-700">
                ✓
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Mahesh Calendar
                </p>
                <h1 className="mt-2 text-3xl font-black text-ink md:text-4xl">
                  Booking Confirmed
                </h1>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Your meeting with Mahesh has been booked successfully.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">
                  Your selected time
                </p>
                <p className="mt-2 font-extrabold leading-6 text-ink">
                  {formatSlotRangeInTimeZone(
                    booking.slotStart,
                    booking.slotEnd,
                    clientTimezone
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">
                  Mahesh calendar time
                </p>
                <p className="mt-2 font-extrabold leading-6 text-ink">
                  {formatSlotRangeInTimeZone(
                    booking.slotStart,
                    booking.slotEnd,
                    MAHESH_TIMEZONE,
                    MAHESH_TIMEZONE_LABEL
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-500">
                  Visitor timezone
                </p>
                <p className="mt-2 font-extrabold leading-6 text-ink">
                  {clientTimezone}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-3">
                <p className="text-sm font-bold text-slate-500">Duration</p>
                <p className="mt-2 font-extrabold leading-6 text-ink">
                  {formatDurationLabel(booking.slotStart, booking.slotEnd)}
                </p>
              </div>
            </div>

            <p className="rounded-md bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              Booking saved successfully.
            </p>
            {emailStatusMessage ? (
              <p className="rounded-md bg-slate-50 p-3 text-sm font-bold text-slate-500">
                {emailStatusMessage}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
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
              {booking.cancelToken ? (
                <a
                  href={getCancelLink(booking, appUrl)}
                  className="inline-flex justify-center rounded-md border border-slate-200 bg-white px-5 py-3 text-center font-bold text-ink transition hover:border-ocean hover:bg-[#f7fbfc]"
                >
                  Cancel Booking
                </a>
              ) : null}
              <Link
                href="/calendar"
                className="inline-flex justify-center rounded-md border border-slate-200 bg-white px-5 py-3 text-center font-bold text-ink transition hover:border-ocean hover:bg-[#f7fbfc]"
              >
                Back to Calendar
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-ink">Booking Confirmed</h1>
            <p className="text-slate-700">
              Your meeting request has been booked. Return to the calendar to view
              more available times.
            </p>
            <Link
              href="/calendar"
              className="inline-flex rounded-md border border-slate-200 bg-white px-5 py-3 font-bold text-ink transition hover:border-ocean hover:bg-[#f7fbfc]"
            >
              Back to Calendar
            </Link>
          </div>
        )}
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
