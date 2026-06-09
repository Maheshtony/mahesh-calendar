"use client";

import { create } from "zustand";
import type { Booking, Slot } from "@/types/booking";

type BookingStore = {
  bookings: Booking[];
  selectedDate: string;
  selectedSlot: Slot | null;
  confirmation: Booking | null;
  setBookings: (bookings: Booking[]) => void;
  setSelectedDate: (date: string) => void;
  setSelectedSlot: (slot: Slot | null) => void;
  setConfirmation: (booking: Booking | null) => void;
};

export const useBookingStore = create<BookingStore>((set) => ({
  bookings: [],
  selectedDate: new Date().toISOString(),
  selectedSlot: null,
  confirmation: null,
  setBookings: (bookings) => set({ bookings }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setSelectedSlot: (selectedSlot) => set({ selectedSlot }),
  setConfirmation: (confirmation) => set({ confirmation })
}));
