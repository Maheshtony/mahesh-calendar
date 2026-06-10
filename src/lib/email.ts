import "server-only";

import { Resend } from "resend";
import {
  getCancelLink,
  getGoogleCalendarUrl,
  getIcsLink
} from "@/lib/calendar-links";
import {
  MAHESH_TIMEZONE,
  MAHESH_TIMEZONE_LABEL,
  formatSlotRangeInTimeZone
} from "@/lib/slots";
import type { Booking, EmailDeliveryResult } from "@/types/booking";

const defaultMaheshEmail = "rudrapatimahesh@gmail.com";

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const maheshEmail =
    process.env.MAHESH_NOTIFY_EMAIL?.trim() || defaultMaheshEmail;

  if (!apiKey || !from) {
    return null;
  }

  return {
    resend: new Resend(apiKey),
    from,
    maheshEmail
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bookingTimes(booking: Booking) {
  return {
    client: formatSlotRangeInTimeZone(
      booking.slotStart,
      booking.slotEnd,
      booking.timezone
    ),
    mahesh: formatSlotRangeInTimeZone(
      booking.slotStart,
      booking.slotEnd,
      MAHESH_TIMEZONE,
      MAHESH_TIMEZONE_LABEL
    )
  };
}

function paragraph(label: string, value: string) {
  return `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

export async function sendBookingConfirmationEmails(
  booking: Booking
): Promise<EmailDeliveryResult> {
  const config = getEmailConfig();

  if (!config) {
    return {
      status: "skipped",
      message: "Email confirmation skipped because email is not configured."
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const times = bookingTimes(booking);
  const cancelLink = getCancelLink(booking, appUrl);
  const googleCalendarLink = getGoogleCalendarUrl(
    booking,
    booking.timezone,
    appUrl
  );
  const icsLink = getIcsLink(booking.id, appUrl);

  try {
    await Promise.all([
      config.resend.emails.send({
        from: config.from,
        to: booking.email,
        subject: "Your meeting with Mahesh is booked",
        html: `
          <h1>Your meeting with Mahesh is booked</h1>
          ${paragraph("Selected time", times.client)}
          ${paragraph("Mahesh IST time", times.mahesh)}
          ${paragraph("Notes", booking.notes || "None")}
          <p><a href="${escapeHtml(googleCalendarLink)}">Add to Google Calendar</a></p>
          <p><a href="${escapeHtml(icsLink)}">Download ICS calendar invite</a></p>
          <p><a href="${escapeHtml(cancelLink)}">Cancel booking</a></p>
        `
      }),
      config.resend.emails.send({
        from: config.from,
        to: config.maheshEmail,
        subject: `New booking: ${booking.name}`,
        html: `
          <h1>New booking</h1>
          ${paragraph("Client name", booking.name)}
          ${paragraph("Client email", booking.email)}
          ${paragraph("Notes", booking.notes || "None")}
          ${paragraph("Selected time", times.client)}
          ${paragraph("Mahesh IST time", times.mahesh)}
          <p><a href="${escapeHtml(cancelLink)}">Cancel/manage booking</a></p>
        `
      })
    ]);

    return {
      status: "sent",
      message: "Email confirmation sent."
    };
  } catch (error) {
    console.error("[email] Booking confirmation email failed", error);

    return {
      status: "failed",
      message: "Email confirmation could not be sent."
    };
  }
}

export async function sendCancellationEmails(
  booking: Booking
): Promise<EmailDeliveryResult> {
  const config = getEmailConfig();

  if (!config) {
    return {
      status: "skipped",
      message: "Cancellation email skipped because email is not configured."
    };
  }

  const times = bookingTimes(booking);

  try {
    await Promise.all([
      config.resend.emails.send({
        from: config.from,
        to: booking.email,
        subject: "Your meeting with Mahesh was cancelled",
        html: `
          <h1>Your booking has been cancelled</h1>
          ${paragraph("Cancelled meeting time", times.client)}
          ${paragraph("Mahesh IST time", times.mahesh)}
        `
      }),
      config.resend.emails.send({
        from: config.from,
        to: config.maheshEmail,
        subject: `Booking cancelled: ${booking.name}`,
        html: `
          <h1>Booking cancelled</h1>
          ${paragraph("Client name", booking.name)}
          ${paragraph("Client email", booking.email)}
          ${paragraph("Cancelled meeting time", times.client)}
          ${paragraph("Mahesh IST time", times.mahesh)}
        `
      })
    ]);

    return {
      status: "sent",
      message: "Cancellation email sent."
    };
  } catch (error) {
    console.error("[email] Cancellation email failed", error);

    return {
      status: "failed",
      message: "Cancellation email could not be sent."
    };
  }
}
