# Mahesh Calendar

Mahesh Calendar is a standalone Next.js 15 + TypeScript MVP for a personal booking calendar.

Clients can view available 30-minute meeting slots, see times in their own timezone, submit a booking form, and receive a confirmation page. Google Calendar is the production source of truth for busy slots and confirmed bookings.

Current owner availability is every day, 24 hours per day. Past slots are hidden, booked slots are disabled, and booking times are stored internally as UTC ISO strings.

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- FullCalendar
- date-fns
- Zustand
- googleapis
- Google Calendar production booking storage
- Local JSON storage for development fallback only

## Run Locally

```bash
npm install
npm run dev
```

The app runs on:

```text
http://localhost:3001
```

Port `3000` is intentionally not used.

## Google Calendar Setup

Google Calendar is the production source of truth. In production, bookings are created directly on Mahesh's Google Calendar and availability is read from Mahesh's busy events.

Local development can run without Google Calendar credentials. If Google Calendar variables are missing locally, the app uses `data/bookings.json` as a development fallback only.

To prepare Google Calendar sync locally:

1. Create a Google Cloud service account.
2. Enable the Google Calendar API for the Google Cloud project.
3. Create a service account key and copy the client email and private key.
4. Share the target Google Calendar with the service account email.
5. Copy `.env.example` to `.env.local`.
6. Fill in:

```text
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_CALENDAR_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

For `GOOGLE_PRIVATE_KEY`, keep the key server-side only. Do not expose it in any `NEXT_PUBLIC_` variable. If the key is stored on one line, use escaped newlines as `\n`.

Clients do not need Google login. The server uses the service account to read busy slots and create events directly in Mahesh's calendar.

## Supabase Future Storage Notes

Supabase is not required for the current production booking flow. Google Calendar is the active source of truth.

If Supabase is added later for reporting, analytics, or backup storage, this legacy table shape can be used:

```sql
create table if not exists bookings (
  id text primary key,
  name text not null,
  email text not null,
  notes text,
  start_time text not null,
  end_time text not null,
  timezone text not null,
  created_at text not null
);

create unique index if not exists bookings_start_time_key
  on bookings (start_time);
```

The unique index prevents duplicate bookings for the same `start_time`.

Optional future Supabase variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` must only be used on the server. Do not expose it to client components or `NEXT_PUBLIC_` variables.

## Vercel Deployment Notes

1. Deploy the `mahesh-calendar` folder as the app root.
2. Set `NEXT_PUBLIC_APP_URL` to the deployed URL.
3. Add Google Calendar variables for production booking.
4. Keep the Google private key as a server-side environment variable.

Local JSON storage is useful for development only. Vercel production must use Google Calendar credentials because filesystem writes are not durable across deployments or serverless instances.

## Vercel Deployment Guide

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Set the Vercel project root to `mahesh-calendar` if this app lives inside a larger workspace.
4. Use the default Next.js framework preset.
5. Use `npm install` as the install command.
6. Use `npm run build` as the build command.
7. Add Google Calendar production environment variables in Vercel.
8. Deploy.
9. Visit `/api/health` on the deployed URL.
10. Make a test booking from `/calendar`.

## GitHub Deployment Guide

Recommended flow:

1. Commit changes from the `mahesh-calendar` app.
2. Push to GitHub.
3. Connect the GitHub repository to Vercel.
4. Use Vercel preview deployments for pull requests.
5. Merge to the production branch when the preview booking flow works.

If the repository contains multiple projects, configure Vercel so the app root is:

```text
mahesh-calendar
```

## Production Environment Variables

Base app variable:

```text
NEXT_PUBLIC_APP_URL=https://your-vercel-app-url
```

Optional future Supabase storage:

```text
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Required Google Calendar production booking:

```text
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_CALENDAR_ID=
```

The app continues working locally if Google Calendar variables are missing by using JSON fallback. In production, missing Google Calendar variables show a configuration error instead of accepting bookings.

Do not expose these server-side secrets to frontend code:

- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_CALENDAR_ID`

## Health Check

The production readiness endpoint is:

```text
/api/health
```

Example response:

```json
{
  "status": "ok",
  "storage": "google-calendar",
  "googleCalendar": "configured",
  "timestamp": "2026-06-09T00:00:00.000Z"
}
```

## Pages

- `/` - Landing page
- `/calendar` - Calendar and booking form
- `/confirmation` - Booking confirmation page

## Local Development Storage

When Google Calendar is not configured locally, bookings are written to:

```text
data/bookings.json
```

This is suitable for local MVP testing only. Production booking storage uses Google Calendar.
