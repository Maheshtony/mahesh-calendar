import { google } from "googleapis";
import {
  getGoogleCalendarEnvStatus,
  getGooglePrivateKey
} from "@/lib/env-validation";
import type { Booking, CalendarSync } from "@/types/booking";

function getGoogleCalendarConfig() {
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

export async function createGoogleCalendarEvent(
  booking: Booking
): Promise<CalendarSync> {
  const config = getGoogleCalendarConfig();

  if (!config) {
    return {
      status: "skipped",
      message: "Google Calendar is not configured."
    };
  }

  try {
    const auth = new google.auth.JWT({
      email: config.clientEmail,
      key: config.privateKey,
      scopes: ["https://www.googleapis.com/auth/calendar.events"]
    });
    const calendar = google.calendar({ version: "v3", auth });
    const response = await calendar.events.insert({
      calendarId: config.calendarId,
      requestBody: {
        summary: `Meeting with ${booking.name}`,
        description: [
          `Email: ${booking.email}`,
          `Notes: ${booking.notes || "None"}`,
          `Timezone: ${booking.timezone}`
        ].join("\n"),
        start: {
          dateTime: booking.slotStart,
          timeZone: "UTC"
        },
        end: {
          dateTime: booking.slotEnd,
          timeZone: "UTC"
        }
      }
    });

    return {
      status: "created",
      message: "Google Calendar event created.",
      eventId: response.data.id || undefined
    };
  } catch (error) {
    return {
      status: "failed",
      message:
        error instanceof Error
          ? error.message
          : "Google Calendar event creation failed."
    };
  }
}
