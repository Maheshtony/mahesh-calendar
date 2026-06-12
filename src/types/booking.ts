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
  status: "confirmed" | "cancelled";
  cancelledAt?: string;
  cancelToken?: string;
  calendarSync?: CalendarSync;
  googleEventId?: string;
  googleEventHtmlLink?: string;
  calendarSyncStatus?:
    | "synced"
    | "skipped"
    | "failed"
    | "cancelled"
    | "cancel_failed";
  calendarSyncedAt?: string;
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

export type MeetingDurationMinutes = 30 | 60;

export type EmailDeliveryStatus = "sent" | "skipped" | "failed";

export type EmailDeliveryResult = {
  status: EmailDeliveryStatus;
  message: string;
};
