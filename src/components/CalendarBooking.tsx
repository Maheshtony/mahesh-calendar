"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { EventContentArg } from "@fullcalendar/core";
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
        title: slot.available ? "" : "Booked",
        display: "block",
        classNames: [slot.available ? "available-slot" : "booked-slot"],
        extendedProps: {
          available: slot.available
        }
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

  function renderEventContent(eventInfo: EventContentArg) {
    return (
      <span>
        {eventInfo.timeText}
        {eventInfo.event.extendedProps.available ? "" : " Booked"}
      </span>
    );
  }

  return (
    <div className="grid min-h-screen gap-6 bg-[#f5f8fb] p-3 md:p-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="min-h-[64vh] rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm md:p-7 lg:min-h-[calc(100vh-48px)]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#247889]">
              Mahesh Calendar
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-ink md:text-4xl">
              Book a 30-minute meeting with Mahesh
            </h1>
          </div>
          <p className="rounded-md bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
            Times shown in your timezone: {timezone}
          </p>
        </div>

        <div className="h-[620px] overflow-hidden rounded-lg border border-slate-200/80 lg:h-[calc(100vh-210px)] lg:min-h-[560px]">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="100%"
            expandRows
            dateClick={handleDateClick}
            events={events}
            eventContent={renderEventContent}
            eventTimeFormat={{
              hour: "numeric",
              minute: "2-digit",
              meridiem: "short"
            }}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth"
            }}
          />
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">Selected Date</p>
          <h2 className="mt-2 text-xl font-black text-ink md:text-2xl">
            {formatDateLabel(new Date(selectedDate))}
          </h2>
          <p className="mt-4 rounded-md bg-[#eef8fa] px-3 py-2 text-sm font-bold leading-6 text-[#247889]">
            Bookings are saved securely. Available slots update after booking.
          </p>
        </section>

        <section className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-ink">Available Times</h3>
          {isLoading ? (
            <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500">
              Loading availability...
            </p>
          ) : slotsForSelectedDate.length ? (
            <div className="mt-4 grid max-h-[320px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-2">
              {slotsForSelectedDate.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => chooseSlot(slot)}
                    className={`rounded-md border px-3 py-2.5 text-sm font-bold transition ${
                      isSelected
                        ? "border-[#247889] bg-[#247889] text-white shadow-sm"
                        : slot.available
                          ? "border-slate-200 bg-white text-slate-800 hover:border-[#247889] hover:bg-[#f7fbfc]"
                          : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    }`}
                  >
                    {formatTimeOnly(slot.start)}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500">
              No slots available for this day.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-black text-ink">Booking Details</h3>
          <BookingForm onBooked={refreshBookings} />
        </section>
      </aside>
    </div>
  );
}
