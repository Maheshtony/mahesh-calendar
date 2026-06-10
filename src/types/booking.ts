export type CalendarSyncStatus = "created" | "skipped" | "failed";

export type CalendarSync = {
  status: CalendarSyncStatus;
  message: string;
  eventId?: string;
};

export type Booking = {
  id: string;
  slotStart: string;
  slotEnd: string;
  timezone: string;
  name: string;
  email: string;
  notes: string;
  calendarSync?: CalendarSync;
  createdAt: string;
};

export type Slot = {
  id: string;
  start: string;
  end: string;
  start_time?: string;
  end_time?: string;
  localDisplay?: string;
  maheshDisplay?: string;
  localDisplayTime?: string;
  maheshDisplayTime?: string;
  available: boolean;
};

export type BookingDraft = {
  slotStart: string;
  slotEnd: string;
  timezone: string;
  name: string;
  email: string;
  notes: string;
};
