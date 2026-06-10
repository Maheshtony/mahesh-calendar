"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MAHESH_TIMEZONE,
  MAHESH_TIMEZONE_LABEL,
  formatDurationLabel,
  formatSlotRangeInTimeZone,
  getVisitorTimezone
} from "@/lib/slots";
import type { Booking, EmailDeliveryResult } from "@/types/booking";

function getCancellationEmailMessage(emailStatus: EmailDeliveryResult | null) {
  if (!emailStatus) {
    return "";
  }

  if (emailStatus.status === "skipped") {
    return "Cancellation email is not enabled yet.";
  }

  return emailStatus.message;
}

function CancelContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const token = searchParams.get("token") || "";
  const [booking, setBooking] = useState<Booking | null>(null);
  const [timezone, setTimezone] = useState("Local timezone");
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailDeliveryResult | null>(
    null
  );
  const clientTimezone = booking?.timezone || timezone;
  const isCancelled = booking?.status === "cancelled";
  const emailMessage = getCancellationEmailMessage(emailStatus);

  useEffect(() => {
    setTimezone(getVisitorTimezone());

    if (!id) {
      setIsLoading(false);
      setError("Cancellation link is missing a booking id.");
      return;
    }

    fetch(`/api/bookings?id=${encodeURIComponent(id)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { booking?: Booking } | null) => {
        if (payload?.booking) {
          setBooking(payload.booking);
          return;
        }

        setError("Booking not found. Please contact Mahesh.");
      })
      .catch(() => setError("Unable to load this booking. Please refresh."))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleCancel() {
    setError("");
    setMessage("");

    if (!id || !token) {
      setError("Cancellation link is invalid.");
      return;
    }

    setIsCancelling(true);
    const response = await fetch(`/api/bookings/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });
    const payload = (await response.json()) as {
      booking?: Booking;
      emailStatus?: EmailDeliveryResult;
      message?: string;
    };
    setIsCancelling(false);

    if (!response.ok || !payload.booking) {
      setError(payload.message || "Unable to cancel this booking.");
      return;
    }

    setBooking(payload.booking);
    setEmailStatus(payload.emailStatus || null);
    setMessage(payload.message || "Your booking has been cancelled.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f6f2] p-4 md:p-6">
      <section className="w-full max-w-2xl rounded-lg border border-amber-100 bg-white p-5 shadow-xl md:p-8">

        {isLoading ? (
          <p className="mt-6 text-slate-700">Loading booking...</p>
        ) : booking ? (
          <div className="space-y-5 text-slate-700">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-black ${
                  isCancelled
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {isCancelled ? "!" : "?"}
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-700">
                  Mahesh Calendar
                </p>
                <h1 className="mt-2 text-3xl font-black text-ink md:text-4xl">
                  {isCancelled ? "Booking Cancelled" : "Cancel Booking"}
                </h1>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  {isCancelled
                    ? "Your booking has been cancelled. This time slot is now available again."
                    : "Review your booking before cancelling."}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-500">
                Your selected time
              </p>
              <p className="mt-1 font-extrabold text-ink">
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
              <p className="mt-1 font-extrabold text-ink">
                {formatSlotRangeInTimeZone(
                  booking.slotStart,
                  booking.slotEnd,
                  MAHESH_TIMEZONE,
                  MAHESH_TIMEZONE_LABEL
                )}
              </p>
            </div>
            <p className="rounded-md bg-[#eef8fa] p-4 text-sm font-bold leading-6 text-ocean">
              Booking for {booking.name} ({booking.email})
            </p>
            <p className="rounded-md bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700">
              Duration: {formatDurationLabel(booking.slotStart, booking.slotEnd)}
            </p>

            {message ? (
              <p className="rounded-md bg-amber-50 p-4 text-sm font-bold text-amber-800">
                {message}
              </p>
            ) : null}
            {emailMessage ? (
              <p className="rounded-md bg-slate-50 p-3 text-sm font-bold text-slate-500">
                {emailMessage}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-md bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              {!isCancelled ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling || !token}
                  className="inline-flex justify-center rounded-md bg-amber-700 px-5 py-3 font-bold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              ) : null}
              <Link
                href="/calendar"
                className="inline-flex justify-center rounded-md border border-slate-200 bg-white px-5 py-3 font-bold text-ink transition hover:border-ocean hover:bg-[#f7fbfc]"
              >
                Back to Calendar
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4 text-slate-700">
            {error ? (
              <p className="rounded-md bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </p>
            ) : null}
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

export default function CancelPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-mist p-6">
          <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-ocean">
              Cancel booking
            </p>
            <h1 className="mt-3 text-4xl font-black text-ink">
              Mahesh Calendar
            </h1>
          </section>
        </main>
      }
    >
      <CancelContent />
    </Suspense>
  );
}
