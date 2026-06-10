"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { DayCellContentArg } from "@fullcalendar/core";
import { BookingForm } from "@/components/BookingForm";
import {
  formatDateLabel,
  formatTimeOnly,
  getSlotsForDay,
  getVisitorTimezone
} from "@/lib/slots";
import { useBookingStore } from "@/store/booking-store";
import type { Slot } from "@/types/booking";

const timeGroups = [
  {
    key: "morning",
    label: "Morning",
    range: "6:00 AM - 11:30 AM"
  },
  {
    key: "afternoon",
    label: "Afternoon",
    range: "12:00 PM - 4:30 PM"
  },
  {
    key: "evening",
    label: "Evening",
    range: "5:00 PM - 8:30 PM"
  },
  {
    key: "night",
    label: "Night",
    range: "9:00 PM - 5:30 AM"
  }
] as const;

function getLocalDayRange(dateIso: string) {
  const date = new Date(dateIso);
  const rangeStart = new Date(date);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  return {
    start: rangeStart.toISOString(),
    end: rangeEnd.toISOString()
  };
}

function getSlotGroup(slot: Slot) {
  const hour = new Date(slot.start).getHours();

  if (hour >= 6 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "evening";
  }

  return "night";
}

export function CalendarBooking() {
  const selectedDate = useBookingStore((state) => state.selectedDate);
  const selectedSlot = useBookingStore((state) => state.selectedSlot);
  const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
  const setSelectedSlot = useBookingStore((state) => state.setSelectedSlot);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timezone, setTimezone] = useState("Local timezone");
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [slotsError, setSlotsError] = useState("");

  const refreshSlots = useCallback(async (
    visitorTimezone: string,
    dateIso: string
  ) => {
    setIsLoading(true);
    setSlotsError("");

    try {
      const range = getLocalDayRange(dateIso);
      const params = new URLSearchParams({
        timezone: visitorTimezone,
        start: range.start,
        end: range.end
      });
      const response = await fetch(`/api/slots?${params.toString()}`);
      const payload = (await response.json()) as {
        message?: string;
        slots?: Slot[];
      };

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load slots.");
      }

      setSlots(payload.slots || []);
      setAvailabilityMessage(payload.message || "");
    } catch {
      setSlots([]);
      setAvailabilityMessage("");
      setSlotsError("Unable to load slots. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const detectedTimezone = getVisitorTimezone();
    setTimezone(detectedTimezone);
  }, []);

  useEffect(() => {
    void refreshSlots(timezone, selectedDate);
  }, [refreshSlots, selectedDate, timezone]);

  const slotsForSelectedDate = useMemo(
    () => getSlotsForDay(slots, new Date(selectedDate)),
    [selectedDate, slots]
  );

  const groupedSlots = useMemo(
    () =>
      timeGroups.map((group) => ({
        ...group,
        slots: slotsForSelectedDate.filter(
          (slot) => getSlotGroup(slot) === group.key
        )
      })),
    [slotsForSelectedDate]
  );
  const hasBookedSlots = slotsForSelectedDate.some((slot) => !slot.available);
  const selectedDateObject = new Date(selectedDate);

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

  function renderDayCellContent(dayInfo: DayCellContentArg) {
    const isSelected =
      dayInfo.date.toDateString() === selectedDateObject.toDateString();

    return (
      <div className="mahesh-day-cell">
        <span>{dayInfo.dayNumberText}</span>
        {isSelected && hasBookedSlots ? (
          <span className="mahesh-booked-badge">Booked</span>
        ) : null}
      </div>
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
          <div className="max-w-md rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
            <p className="font-extrabold text-ink">
              All available times are shown in your local timezone.
            </p>
            <p className="mt-1 font-bold">Your timezone: {timezone}</p>
            <p className="mt-2 leading-6">
              Timezone handled automatically. Book in your local time; Mahesh
              will see the correct time in IST.
            </p>
          </div>
        </div>

        <div className="h-[520px] overflow-hidden rounded-lg border border-slate-200/80 lg:h-[calc(100vh-210px)] lg:min-h-[520px]">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="100%"
            expandRows
            dateClick={handleDateClick}
            dayCellContent={renderDayCellContent}
            dayCellClassNames={(dayInfo) =>
              dayInfo.date.toDateString() === selectedDateObject.toDateString()
                ? ["mahesh-selected-day"]
                : []
            }
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
          {availabilityMessage ? (
            <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold leading-6 text-slate-600">
              {availabilityMessage}
            </p>
          ) : null}
          {slotsError ? (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-bold leading-6 text-red-700">
              {slotsError}
            </p>
          ) : null}
        </section>

        <section className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-ink">Available Times</h3>
          {isLoading ? (
            <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500">
              Loading availability...
            </p>
          ) : slotsError ? (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {slotsError}
            </p>
          ) : slotsForSelectedDate.length ? (
            <div className="mt-4 max-h-[420px] space-y-5 overflow-y-auto pr-1">
              {groupedSlots.map((group) =>
                group.slots.length ? (
                  <div key={group.key}>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <h4 className="text-sm font-black text-ink">
                        {group.label}
                      </h4>
                      <p className="text-xs font-bold text-slate-500">
                        {group.range}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                      {group.slots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => chooseSlot(slot)}
                            className={`rounded-md border px-3 py-2.5 text-sm font-bold shadow-sm transition ${
                              isSelected
                                ? "border-[#247889] bg-[#247889] text-white"
                                : slot.available
                                  ? "border-slate-200 bg-white text-slate-800 hover:border-[#247889] hover:bg-[#f7fbfc]"
                                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 shadow-none"
                            }`}
                          >
                            {slot.localDisplay || formatTimeOnly(slot.start)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500">
              No slots available for this day.
            </p>
          )}
        </section>

        <section className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-black text-ink">Booking Details</h3>
          <BookingForm onBooked={() => refreshSlots(timezone, selectedDate)} />
        </section>
      </aside>
    </div>
  );
}
