import { google } from "googleapis";
import {
  getGoogleCalendarEnvStatus,
  getGooglePrivateKey
} from "@/lib/env-validation";
import { getCancelLink } from "@/lib/calendar-links";
import { formatDurationLabel } from "@/lib/slots";
import type { Booking, CalendarSync } from "@/types/booking";

type BusyRange = {
  start: string;
  end: string;
};

export function getGoogleCalendarConfig() {
  const status = getGoogleCalendarEnvStatus();

  if (!status.configured) {
    return null;
  }

  return {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL as string,
    privateKey: getGooglePrivateKey() as string,
    calendarId: process.env.GOOGLE_CALENDAR_ID as string
  };
}

function getCalendarClient() {
  const config = getGoogleCalendarConfig();

  if (!config) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"]
  });

  return {
    calendarId: config.calendarId,
    calendar: google.calendar({ version: "v3", auth })
  };
}

function googleEventToBooking(event: {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
  created?: string | null;
  extendedProperties?: {
    private?: Record<string, string> | null;
  } | null;
}): Booking | null {
  const start = event.start?.dateTime;
  const end = event.end?.dateTime;

  if (!event.id || !start || !end) {
    return null;
  }

  const privateFields = event.extendedProperties?.private || {};
  const name =
    privateFields.name ||
    event.summary?.replace(/^Meeting with /, "") ||
    "Client";

  return {
    id: event.id,
    slotStart: new Date(start).toISOString(),
    slotEnd: new Date(end).toISOString(),
    timezone: privateFields.timezone || "Local timezone",
    name,
    email: privateFields.email || "",
    notes: privateFields.notes || "",
    status: "confirmed",
    createdAt: event.created || new Date().toISOString(),
    calendarSync: {
      status: "created",
      message: "Google Calendar event created.",
      eventId: event.id
    }
  };
}

export async function createGoogleCalendarEvent(
  booking: Booking
): Promise<
  CalendarSync & {
    googleEventId?: string;
    googleEventHtmlLink?: string;
    syncedAt?: string;
  }
> {
  const client = getCalendarClient();

  if (!client) {
    return {
      status: "skipped",
      message: "Google Calendar is not configured."
    };
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const dashboardSecret = process.env.ADMIN_DASHBOARD_SECRET?.trim();
    const dashboardLink =
      appUrl && dashboardSecret
        ? `${appUrl.replace(/\/$/, "")}/admin?secret=${encodeURIComponent(
            dashboardSecret
          )}`
        : "";
    const cancelLink = getCancelLink(booking, appUrl);
    const response = await client.calendar.events.insert({
      calendarId: client.calendarId,
      requestBody: {
        summary: `Meeting with ${booking.name}`,
        description: [
          `Client name: ${booking.name}`,
          `Email: ${booking.email}`,
          `Notes: ${booking.notes || "None"}`,
          `Duration: ${formatDurationLabel(booking.slotStart, booking.slotEnd)}`,
          `Client timezone: ${booking.timezone}`,
          `Booking id: ${booking.id}`,
          cancelLink ? `Cancel booking: ${cancelLink}` : "",
          dashboardLink ? `Dashboard: ${dashboardLink}` : ""
        ]
          .filter(Boolean)
          .join("\n"),
        start: {
          dateTime: booking.slotStart,
          timeZone: booking.timezone || "UTC"
        },
        end: {
          dateTime: booking.slotEnd,
          timeZone: booking.timezone || "UTC"
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 30 },
            { method: "popup", minutes: 10 }
          ]
        },
        extendedProperties: {
          private: {
            bookingId: booking.id,
            name: booking.name,
            email: booking.email,
            notes: booking.notes || "",
            timezone: booking.timezone
          }
        }
      }
    });

    return {
      status: "created",
      message: "Google Calendar event created.",
      eventId: response.data.id || undefined,
      googleEventId: response.data.id || undefined,
      googleEventHtmlLink: response.data.htmlLink || undefined,
      syncedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("[google-calendar] Event creation failed", error);

    return {
      status: "failed",
      message:
        error instanceof Error
          ? error.message
          : "Google Calendar event creation failed."
    };
  }
}

export async function deleteGoogleCalendarEvent(eventId?: string | null) {
  const client = getCalendarClient();

  if (!client || !eventId) {
    return {
      status: "skipped" as const,
      message: "Google Calendar is not configured."
    };
  }

  try {
    await client.calendar.events.delete({
      calendarId: client.calendarId,
      eventId
    });

    return {
      status: "cancelled" as const,
      message: "Google Calendar event removed."
    };
  } catch (error) {
    console.error("[google-calendar] Event deletion failed", error);

    return {
      status: "cancel_failed" as const,
      message:
        error instanceof Error
          ? error.message
          : "Google Calendar event deletion failed."
    };
  }
}

export async function readGoogleCalendarBusyEvents(
  rangeStartIso: string,
  rangeEndIso: string
): Promise<BusyRange[]> {
  const client = getCalendarClient();

  if (!client) {
    return [];
  }

  const response = await client.calendar.freebusy.query({
    requestBody: {
      timeMin: rangeStartIso,
      timeMax: rangeEndIso,
      items: [{ id: client.calendarId }]
    }
  });
  const busyRanges =
    response.data.calendars?.[client.calendarId]?.busy?.filter(
      (busyRange): busyRange is { start: string; end: string } =>
        Boolean(busyRange.start && busyRange.end)
    ) || [];

  return busyRanges.map((busyRange) => ({
    start: new Date(busyRange.start).toISOString(),
    end: new Date(busyRange.end).toISOString()
  }));
}

export async function isGoogleCalendarSlotBusy(
  slotStartIso: string,
  slotEndIso: string
) {
  const busyRanges = await readGoogleCalendarBusyEvents(slotStartIso, slotEndIso);

  return busyRanges.length > 0;
}

export async function readGoogleCalendarBooking(
  eventId: string
): Promise<Booking | null> {
  const client = getCalendarClient();

  if (!client) {
    return null;
  }

  try {
    const response = await client.calendar.events.get({
      calendarId: client.calendarId,
      eventId
    });

    return googleEventToBooking(response.data);
  } catch {
    return null;
  }
}
