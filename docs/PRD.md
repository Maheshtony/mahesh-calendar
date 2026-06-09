# Mahesh Calendar PRD

## Product Summary

Mahesh Calendar is a personal booking calendar for Mahesh. Clients can open a public booking link, view available 30-minute meeting slots in their own timezone, submit a booking request, and receive confirmation.

The MVP stays simple, low-cost, and deployable on Vercel. Clients do not need login. Mahesh/admin setup is private for now through server environment variables.

## Goals

- Let clients book 30-minute meetings with Mahesh.
- Show available slots in the visitor's timezone.
- Hide past slots.
- Prevent duplicate bookings for the same start time.
- Store bookings locally during development.
- Support optional Supabase storage for production.
- Support optional Google Calendar sync for Mahesh when configured.
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

Mahesh configures private environment variables for optional production services such as Supabase and Google Calendar. In the MVP, Mahesh does not use an admin UI.

## MVP Scope

- Landing page.
- Calendar booking page.
- Date selection.
- Available 30-minute slots.
- Booking form with name, email, and notes.
- Confirmation page.
- Local JSON development storage.
- Optional Supabase production storage.
- Optional server-side Google Calendar event creation.

## Booking Rules

- Slot duration is 30 minutes.
- Owner availability is currently every day, 24 hours per day.
- Past slots are hidden.
- Booked slots are disabled.
- Duplicate booking for the same start time is prevented.
- Booking start and end times are stored internally as UTC ISO strings.

## Timezone Behavior

- The app detects the visitor's timezone in the browser.
- The calendar page shows: `Times shown in your timezone: <timezone>`.
- Slot display uses the visitor's local timezone.
- The stored booking includes the visitor timezone string.

## Success Criteria

- A client can book a future available 30-minute slot.
- The booking is saved to `data/bookings.json` when Supabase is not configured.
- The same slot cannot be booked twice.
- The confirmation page shows booked date/time and timezone.
- Google Calendar sync is skipped safely when not configured.
- The app runs locally on `http://localhost:3001`.

