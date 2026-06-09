# Deployment Checklist

Mahesh Calendar is deployable on Vercel as a simple Next.js 15 app. Clients do not need login. Mahesh/admin setup is private through environment variables for now.

## Local Testing Checklist

- Run `npm install`.
- Run `npm run dev`.
- Confirm the app opens on `http://localhost:3001`.
- Open `/calendar`.
- Confirm timezone text appears: `Times shown in your timezone: <timezone>`.
- Select a future date.
- Select an available 30-minute slot.
- Submit name, valid email, and optional notes.
- Confirm `/confirmation?id=<bookingId>` loads.
- Confirm the same slot cannot be booked again.
- Confirm `/api/health` returns `status: ok`.
- Confirm local JSON fallback works only in local development when Google Calendar env vars are missing.

## Environment Variables Checklist

Required for local app URL:

- `NEXT_PUBLIC_APP_URL=http://localhost:3001`

Required production Google Calendar variables:

- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_CALENDAR_ID`

Optional future Supabase variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Security checks:

- No API keys are hardcoded in source files.
- `GOOGLE_PRIVATE_KEY` is server-side only.
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only.
- Only `NEXT_PUBLIC_` variables are available to browser code.

## Google Calendar Configuration Checklist

- Google Calendar API is enabled in Google Cloud.
- A service account exists.
- The target calendar is shared with the service account email.
- `GOOGLE_CLIENT_EMAIL` is set.
- `GOOGLE_PRIVATE_KEY` is set with escaped newlines if stored on one line.
- `GOOGLE_CALENDAR_ID` is set.
- Production booking succeeds only when Google Calendar is configured and event creation succeeds.
- `/api/health` reports `googleCalendar: configured` only when all Google vars are present.

## Supabase Future Configuration Checklist

- Supabase is not required for current production booking.
- Supabase project exists if future reporting or backup storage is added.
- `bookings` table exists.
- `start_time` has a unique index.
- `NEXT_PUBLIC_SUPABASE_URL` is set.
- `SUPABASE_SERVICE_ROLE_KEY` is set as a server-side environment variable.
- Service role key is never exposed to client components.
- `/api/health` does not require Supabase for production readiness.
- `/api/health` reports `storage: google-calendar` when Google Calendar is configured.

Required SQL:

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

## Production Hardening Review

- No secrets are exposed to frontend code.
- No server credentials are rendered in UI or returned from API responses.
- No hardcoded API keys are present.
- Booking form validates name, email, and selected slot.
- Booking API validates name, email, selected slot, and future start time.
- Duplicate booking protection exists through Google Calendar busy checks in production.
- Duplicate booking protection exists in local JSON development fallback.
- Booking times are stored internally as UTC ISO strings.
- Visitor timezone is detected in the browser and stored with the booking.
- Google Calendar errors prevent production booking creation so clients do not receive false confirmations.

## Vercel Deployment Checklist

- Connect the GitHub repository to Vercel.
- Set Vercel project root to `mahesh-calendar` if deploying from a larger workspace.
- Use install command: `npm install`.
- Use build command: `npm run build`.
- Set `NEXT_PUBLIC_APP_URL` to the production URL.
- Add Google Calendar env vars for production booking.
- Add Supabase env vars only if future storage/reporting is added.
- Deploy.
- Open `/api/health` on the production URL.
- Make a test booking.
- Confirm the booking appears in Mahesh Google Calendar.
- Confirm Google Calendar sync status is created on confirmation page.

## Rollback Checklist

- Use Vercel's previous deployment rollback if a deploy fails.
- If Supabase configuration causes issues, remove Supabase env vars; current booking flow does not require Supabase.
- If Google Calendar configuration causes issues, rollback the deployment or fix env vars; production booking requires Google Calendar.
- Preserve `bookings` table data before schema changes.
- Re-run a booking smoke test after rollback.
