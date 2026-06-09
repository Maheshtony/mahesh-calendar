# Technical Architecture

## Stack

- Next.js 15 with App Router.
- TypeScript.
- Tailwind CSS.
- FullCalendar for month calendar UI.
- date-fns for date helpers.
- Zustand for client booking state.
- Local JSON file storage for development.
- Optional Supabase storage for production.
- Optional Google Calendar sync through `googleapis`.

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
- `src/lib/storage.ts` - storage adapter for Supabase or local JSON.
- `src/lib/supabase.ts` - server-side Supabase client creation.
- `src/lib/google-calendar.ts` - server-side Google Calendar event helper.
- `data/bookings.json` - local development booking storage.

## Storage Adapter

`src/lib/storage.ts` is the source of truth for booking persistence.

If both Supabase environment variables exist, storage uses the Supabase `bookings` table:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

If either is missing, storage falls back to `data/bookings.json`.

The API behavior stays the same in both modes:

- read bookings.
- find booking by id.
- create booking.
- prevent duplicate start times.

## Supabase Table

The production table is named `bookings`.

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

## Google Calendar Sync

Google Calendar sync happens after a booking is saved.

The helper returns one of:

- `created`
- `skipped`
- `failed`

If Google Calendar environment variables are missing, sync is skipped and booking still succeeds.

## Data Flow

1. Client opens `/calendar`.
2. UI fetches existing bookings from `/api/bookings`.
3. Browser detects visitor timezone.
4. Slot helper generates future 30-minute slots.
5. Client selects a slot and submits the form.
6. API validates the booking.
7. Storage adapter saves to Supabase or local JSON.
8. API attempts optional Google Calendar sync.
9. Client navigates to `/confirmation?id=<bookingId>`.

