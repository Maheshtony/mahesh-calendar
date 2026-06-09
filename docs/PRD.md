# Mahesh Calendar PRD

## Product Summary

Mahesh Calendar is a personal booking calendar for Mahesh. Clients can open a public booking link, view available 30-minute meeting slots in their own timezone, submit a booking request, and receive confirmation.

The MVP stays simple, low-cost, and deployable on Vercel. Clients do not need login. Mahesh/admin setup is private for now through server environment variables.

## Goals

- Let clients book 30-minute meetings with Mahesh.
- Show available slots in the visitor's timezone.
- Hide past slots.
- Prevent duplicate bookings for the same start time.
- Store bookings locally during development only when Google Calendar is not configured.
- Use Google Calendar as the production source of truth for busy slots and bookings.
- Keep Supabase as optional future storage, not required for production booking.
- Keep setup easy: `npm install`, `npm run dev`, local port `3001`.

## Non-Goals

- No client login.
- No admin dashboard yet.
- No Google login for clients.
- No paid scheduling features yet.
- No recurring availability rules yet.
- No payment collection.
- No multi-owner scheduling.

## Users

### Client

A client opens Mahesh's public booking link, chooses a date and 30-minute slot, enters name, email, and notes, then confirms the booking.

### Mahesh

Mahesh configures private environment variables for Google Calendar. In the MVP, Mahesh does not use an admin UI.

## MVP Scope

- Landing page.
- Calendar booking page.
- Date selection.
- Available 30-minute slots.
- Booking form with name, email, and notes.
- Confirmation page.
- Local JSON development fallback.
- Server-side Google Calendar busy reads and event creation.
- Optional future Supabase storage for reporting or backup, not required now.

## Booking Rules

- Slot duration is 30 minutes.
- Owner availability is currently every day, 24 hours per day.
- Past slots are hidden.
- Booked slots are disabled.
- Duplicate booking for the same start time is prevented.
- Booking start and end times are stored internally as UTC ISO strings.
- In production, duplicate protection checks Mahesh's Google Calendar busy events before creating an event.

## Timezone Behavior

- The app detects the visitor's timezone in the browser.
- The calendar page shows: `Times shown in your timezone: <timezone>`.
- Slot display uses the visitor's local timezone.
- The stored booking includes the visitor timezone string.

## Success Criteria

- A client can book a future available 30-minute slot.
- The booking is created in Google Calendar in production.
- Local JSON fallback works only for development when Google Calendar is not configured.
- The same slot cannot be booked twice.
- The confirmation page shows booked date/time and timezone.
- Production shows a configuration error if Google Calendar is missing.
- The app runs locally on `http://localhost:3001`.
