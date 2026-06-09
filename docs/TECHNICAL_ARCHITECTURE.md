# Technical Architecture

## Stack

- Next.js 15 with App Router.
- TypeScript.
- Tailwind CSS.
- FullCalendar for month calendar UI.
- date-fns for date helpers.
- Zustand for client booking state.
- Google Calendar production booking storage through `googleapis`.
- Local JSON file storage for development fallback only.
- Optional future Supabase storage for reporting or backup.

## Runtime

The app runs locally on port `3001`.

```bash
npm run dev
```

Local URL:

```text
http://localhost:3001
```

## Main Routes

- `/` - landing page.
- `/calendar` - booking calendar and form.
- `/confirmation` - booking confirmation page.
- `/api/bookings` - booking read/create API.

## Key Files

- `src/components/CalendarBooking.tsx` - primary booking UI.
- `src/components/BookingForm.tsx` - booking form and submission.
- `src/lib/slots.ts` - slot generation, formatting, timezone helpers, email validation.
- `src/lib/storage.ts` - local JSON development fallback.
- `src/lib/supabase.ts` - server-side Supabase client creation.
- `src/lib/google-calendar.ts` - server-side Google Calendar event and busy-slot helper.
- `data/bookings.json` - local development booking storage.

## Booking Source Of Truth

Google Calendar is the production source of truth.

Production booking flow:

- read busy events from Mahesh Google Calendar.
- mark overlapping 30-minute slots unavailable.
- check the selected slot again at submit time.
- create the booking directly as a Google Calendar event.

Local development fallback:

- if Google Calendar env vars are missing and `NODE_ENV` is not production, use `data/bookings.json`.
- never use local JSON as production source of truth.

## Supabase Future Table

Supabase is optional future storage, not required for the current production booking flow. If added later, the table can be named `bookings`.

Fields:

- `id text primary key`
- `name text not null`
- `email text not null`
- `notes text`
- `start_time text not null`
- `end_time text not null`
- `timezone text not null`
- `created_at text not null`

A unique index on `start_time` prevents duplicate bookings.

## Google Calendar

Google Calendar handles production availability and booking creation.

The helper supports:

- create event.
- read busy events for a date range.
- check whether a selected slot overlaps a busy event.
- read an event by id for confirmation.

If Google Calendar environment variables are missing in production, booking is disabled with a configuration message.

## Data Flow

1. Client opens `/calendar`.
2. UI fetches slots from `/api/slots`.
3. Browser detects visitor timezone.
4. API reads Google Calendar busy events or local fallback bookings in development.
5. Client selects a slot and submits the form.
6. API validates the booking.
7. API checks Google Calendar busy state again.
8. API creates the Google Calendar event.
9. Client navigates to `/confirmation?id=<bookingId>`.
