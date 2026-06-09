"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import { BookingForm } from "@/components/BookingForm";
import {
  formatDateLabel,
  formatTimeOnly,
  generateSlots,
  getSlotsForDay,
  getVisitorTimezone
} from "@/lib/slots";
import { useBookingStore } from "@/store/booking-store";
import type { Booking, Slot } from "@/types/booking";

export function CalendarBooking() {
  const bookings = useBookingStore((state) => state.bookings);
  const selectedDate = useBookingStore((state) => state.selectedDate);
  const selectedSlot = useBookingStore((state) => state.selectedSlot);
  const setBookings = useBookingStore((state) => state.setBookings);
  const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
  const setSelectedSlot = useBookingStore((state) => state.setSelectedSlot);
  const [isLoading, setIsLoading] = useState(true);
  const [timezone, setTimezone] = useState("Local timezone");

  const refreshBookings = useCallback(async () => {
    const response = await fetch("/api/bookings");
    const payload = (await response.json()) as { bookings: Booking[] };
    setBookings(payload.bookings);
    setIsLoading(false);
  }, [setBookings]);

  useEffect(() => {
    setTimezone(getVisitorTimezone());
    void refreshBookings();
  }, [refreshBookings]);

  const slots = useMemo(() => generateSlots(bookings), [bookings]);
  const slotsForSelectedDate = useMemo(
    () => getSlotsForDay(slots, new Date(selectedDate)),
    [selectedDate, slots]
  );

  const events = useMemo(
    () =>
      slots.map((slot) => ({
        id: slot.id,
        start: slot.start,
        end: slot.end,
        title: slot.available ? "Open" : "Booked",
        display: "block",
        color: slot.available ? "#1d7a8c" : "#94a3b8"
      })),
    [slots]
  );

  function handleDateClick(info: DateClickArg) {
    setSelectedDate(info.date.toISOString());
    setSelectedSlot(null);
  }

  function chooseSlot(slot: Slot) {
    if (!slot.available) {
      return;
    }

    setSelectedSlot(slot);
  }

  return (
    <div className="grid min-h-screen gap-5 bg-mist p-3 md:p-5 lg:grid-cols-[1fr_420px] lg:p-6">
      <section className="min-h-[64vh] rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-5 lg:min-h-[calc(100vh-48px)]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-ocean">
              Mahesh Calendar
            </p>
            <h1 className="mt-1 text-2xl font-black text-ink md:text-3xl">
              Book a 30-minute meeting with Mahesh
            </h1>
          </div>
          <p className="rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
            Times shown in your timezone: {timezone}
          </p>
        </div>

        <div className="h-[620px] lg:h-[calc(100vh-190px)] lg:min-h-[560px]">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="100%"
            expandRows
            dateClick={handleDateClick}
            events={events}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth"
            }}
          />
        </div>
      </section>

      <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-5">
          <p className="text-sm font-bold text-slate-500">Selected day</p>
          <h2 className="mt-1 text-xl font-black text-ink md:text-2xl">
            {formatDateLabel(new Date(selectedDate))}
          </h2>
          <p className="mt-3 rounded-md bg-[#e7f5f7] px-3 py-2 text-sm font-bold text-ocean">
            Bookings are saved securely. Available slots update after booking.
          </p>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-sm font-bold text-ink">
            30-minute time slots
          </p>
          {isLoading ? (
            <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500">
              Loading availability...
            </p>
          ) : slotsForSelectedDate.length ? (
            <div className="grid max-h-[340px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-2">
              {slotsForSelectedDate.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => chooseSlot(slot)}
                    className={`rounded-md border px-3 py-2 text-sm font-extrabold transition ${
                      isSelected
                        ? "border-ocean bg-ocean text-white"
                        : slot.available
                          ? "border-ocean/30 bg-[#e7f5f7] text-ocean hover:border-ocean"
                          : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    }`}
                  >
                    {formatTimeOnly(slot.start)}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500">
              No slots available for this day.
            </p>
          )}
        </div>

        <BookingForm onBooked={refreshBookings} />
      </aside>
    </div>
  );
}
