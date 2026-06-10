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
import type { MeetingDurationMinutes, Slot } from "@/types/booking";

const fallbackTimezones = [
  "Asia/Calcutta",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney"
];

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
  rangeEnd.setMinutes(rangeEnd.getMinutes() + 30);

  return {
    start: rangeStart.toISOString(),
    end: rangeEnd.toISOString()
  };
}

function getSupportedTimezones() {
  if (
    typeof Intl.supportedValuesOf === "function"
  ) {
    return Intl.supportedValuesOf("timeZone");
  }

  return fallbackTimezones;
}

function getHourInTimezone(iso: string, timeZone: string) {
  try {
    const hour = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone
    }).format(new Date(iso));

    return Number(hour);
  } catch {
    return new Date(iso).getHours();
  }
}

function getSlotGroup(slot: Slot, timeZone: string) {
  const hour = getHourInTimezone(slot.start, timeZone);

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
  const [timezone, setTimezone] = useState("Asia/Calcutta");
  const [durationMinutes, setDurationMinutes] =
    useState<MeetingDurationMinutes>(30);
  const [slotsError, setSlotsError] = useState("");
  const [slotMessage, setSlotMessage] = useState("");
  const timezoneOptions = useMemo(getSupportedTimezones, []);

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
    } catch {
      setSlots([]);
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
          (slot) => getSlotGroup(slot, timezone) === group.key
        )
      })),
    [slotsForSelectedDate, timezone]
  );
  const hasBookedSlots = slotsForSelectedDate.some((slot) => !slot.available);
  const selectedDateObject = new Date(selectedDate);

  function findNextSlot(slot: Slot) {
    const expectedStart = new Date(slot.start).getTime() + 30 * 60000;

    return slots.find(
      (candidate) => new Date(candidate.start).getTime() === expectedStart
    );
  }

  function isSlotBookable(slot: Slot) {
    if (!slot.available) {
      return false;
    }

    if (durationMinutes === 30) {
      return true;
    }

    const nextSlot = findNextSlot(slot);

    return Boolean(nextSlot?.available);
  }

  function handleDateClick(info: DateClickArg) {
    setSelectedDate(info.date.toISOString());
    setSelectedSlot(null);
    setSlotMessage("");
  }

  function chooseSlot(slot: Slot) {
    if (!slot.available) {
      setSlotMessage("This time is already booked. Please choose another slot.");
      return;
    }

    if (!isSlotBookable(slot)) {
      setSlotMessage(
        "One hour is not available from this start time. Please choose another time."
      );
      return;
    }

    setSlotMessage("");
    setSelectedSlot(slot);
  }

  function renderDayCellContent(dayInfo: DayCellContentArg) {
    const isSelected =
      dayInfo.date.toDateString() === selectedDateObject.toDateString();

    return (
      <div className="mahesh-day-cell">
        <span>{dayInfo.dayNumberText}</span>
        {isSelected && hasBookedSlots ? (
          <span className="mahesh-booked-dot" aria-label="Booked slots" />
        ) : null}
      </div>
    );
  }

  function handleTimezoneChange(nextTimezone: string) {
    setTimezone(nextTimezone);
    setSelectedSlot(null);
    setSlotMessage("");
  }

  function handleDurationChange(nextDuration: MeetingDurationMinutes) {
    setDurationMinutes(nextDuration);
    setSelectedSlot(null);
    setSlotMessage("");
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
              All available times are shown in your selected timezone.
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
            Available slots update after each booking.
          </p>
          {slotsError ? (
            <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-bold leading-6 text-red-700">
              {slotsError}
            </p>
          ) : null}
        </section>

        <section className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-ink">Available Times</h3>
          <label className="mt-4 block">
            <span className="text-sm font-bold text-ink">Your timezone</span>
            <select
              value={timezone}
              onChange={(event) => handleTimezoneChange(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-[#247889] focus:ring-2 focus:ring-[#247889]/15"
            >
              {timezoneOptions.map((timeZone) => (
                <option key={timeZone} value={timeZone}>
                  {timeZone}
                </option>
              ))}
            </select>
            <span className="mt-2 block text-xs font-bold leading-5 text-slate-500">
              All available times are shown in your selected timezone.
            </span>
          </label>
          <div className="mt-4">
            <p className="text-sm font-bold text-ink">Meeting duration</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[30, 60].map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() =>
                    handleDurationChange(duration as MeetingDurationMinutes)
                  }
                  className={`rounded-md border px-3 py-2.5 text-sm font-bold transition ${
                    durationMinutes === duration
                      ? "border-[#247889] bg-[#247889] text-white"
                      : "border-slate-200 bg-white text-slate-800 hover:border-[#247889] hover:bg-[#f7fbfc]"
                  }`}
                >
                  {duration === 30 ? "30 minutes" : "1 hour"}
                </button>
              ))}
            </div>
            {durationMinutes === 60 ? (
              <p className="mt-2 text-xs font-bold text-slate-500">
                1 hour requires two continuous 30-minute slots.
              </p>
            ) : null}
          </div>
          {hasBookedSlots ? (
            <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold leading-6 text-slate-600">
              Some times are already booked. Booked slots are disabled below.
            </p>
          ) : null}
          {slotMessage ? (
            <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-bold leading-6 text-amber-800">
              {slotMessage}
            </p>
          ) : null}
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
                        const isBookable = isSlotBookable(slot);
                        const isBooked = !slot.available;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => chooseSlot(slot)}
                            aria-disabled={!isBookable}
                            className={`rounded-md border px-3 py-2.5 text-sm font-bold shadow-sm transition ${
                              isSelected
                                ? "border-[#247889] bg-[#247889] text-white"
                                : isBookable
                                  ? "border-slate-200 bg-white text-slate-800 hover:border-[#247889] hover:bg-[#f7fbfc]"
                                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 shadow-none"
                            }`}
                          >
                            <span className="block">
                              {slot.localDisplay || formatTimeOnly(slot.start)}
                            </span>
                            {isBooked ? (
                              <span className="mt-1 block text-[0.68rem] font-black uppercase tracking-[0.08em]">
                                Booked
                              </span>
                            ) : null}
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
          <BookingForm
            durationMinutes={durationMinutes}
            timezone={timezone}
            onBooked={() => refreshSlots(timezone, selectedDate)}
          />
        </section>
      </aside>
    </div>
  );
}
