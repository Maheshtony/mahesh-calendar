"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MAHESH_TIMEZONE,
  MAHESH_TIMEZONE_LABEL,
  formatSlotRangeInTimeZone,
  isValidEmail
} from "@/lib/slots";
import { useBookingStore } from "@/store/booking-store";
import type {
  Booking,
  EmailDeliveryResult,
  MeetingDurationMinutes
} from "@/types/booking";

function getSlotEnd(startIso: string, durationMinutes: MeetingDurationMinutes) {
  return new Date(
    new Date(startIso).getTime() + durationMinutes * 60000
  ).toISOString();
}

export function BookingForm({
  durationMinutes,
  timezone,
  onBooked
}: {
  durationMinutes: MeetingDurationMinutes;
  timezone: string;
  onBooked: () => Promise<void>;
}) {
  const router = useRouter();
  const selectedSlot = useBookingStore((state) => state.selectedSlot);
  const setConfirmation = useBookingStore((state) => state.setConfirmation);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedSlotEnd = selectedSlot
    ? getSlotEnd(selectedSlot.start, durationMinutes)
    : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedSlot) {
      setError("Select an available 30-minute slot.");
      return;
    }

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        slotStart: selectedSlot.start,
        slotEnd: selectedSlotEnd,
        timezone,
        name,
        email,
        notes
      })
    });

    const payload = (await response.json()) as {
      booking?: Booking;
      emailStatus?: EmailDeliveryResult;
      message?: string;
    };

    setIsSubmitting(false);

    if (!response.ok || !payload.booking) {
      setError(payload.message || "Unable to create booking.");
      await onBooked();
      return;
    }

    setConfirmation(payload.booking);
    await onBooked();
    const params = new URLSearchParams({
      id: payload.booking.id
    });

    if (payload.emailStatus?.status) {
      params.set("emailStatus", payload.emailStatus.status);
    }

    router.push(`/confirmation?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-b border-slate-200 pb-4">
        <p className="text-sm font-bold text-slate-500">Selected slot</p>
        {selectedSlot ? (
          <div className="mt-2 space-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Selected time in your timezone:
              </p>
              <p className="mt-1 text-base font-extrabold text-ink">
                {formatSlotRangeInTimeZone(
                  selectedSlot.start,
                  selectedSlotEnd,
                  timezone
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Duration:
              </p>
              <p className="mt-1 text-base font-extrabold text-ink">
                {durationMinutes === 30 ? "30 minutes" : "1 hour"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Mahesh receives this as:
              </p>
              <p className="mt-1 text-base font-extrabold text-ink">
                {formatSlotRangeInTimeZone(
                  selectedSlot.start,
                  selectedSlotEnd,
                  MAHESH_TIMEZONE,
                  MAHESH_TIMEZONE_LABEL
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-base font-extrabold text-ink">
            Select an available slot
          </p>
        )}
      </div>

      <label className="block">
        <span className="text-sm font-bold text-ink">Name</span>
        <input
          required
          placeholder="Your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#247889] focus:ring-2 focus:ring-[#247889]/15"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-ink">Email</span>
        <input
          required
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#247889] focus:ring-2 focus:ring-[#247889]/15"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-ink">Notes</span>
        <textarea
          rows={4}
          placeholder="Anything Mahesh should know before the meeting"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-2 w-full resize-none rounded-md border border-slate-200 px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#247889] focus:ring-2 focus:ring-[#247889]/15"
        />
      </label>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!selectedSlot || isSubmitting}
        className="w-full rounded-md bg-[#247889] px-4 py-3 font-extrabold text-white transition hover:bg-[#1d6573] disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "Booking..." : "Confirm Booking"}
      </button>
    </form>
  );
}
