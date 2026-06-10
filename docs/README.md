# Mahesh Calendar Docs

## Supabase Cancellation Migration

Run this SQL in Supabase before deploying booking cancellation:

```sql
alter table bookings
add column if not exists status text not null default 'confirmed';

alter table bookings
add column if not exists cancelled_at text;

alter table bookings
add column if not exists cancel_token text;

create unique index if not exists bookings_cancel_token_key
on bookings (cancel_token);
```

Confirmed bookings block slots. Cancelled bookings remain stored for history but
do not block future availability.

If the older all-status `start_time` unique index exists, replace it with a
confirmed-bookings-only index so cancelled slots can be rebooked:

```sql
drop index if exists bookings_start_time_key;

create unique index if not exists bookings_confirmed_start_time_key
on bookings (start_time)
where status = 'confirmed';
```

## Email Environment Variables

Resend email confirmation is optional. If these variables are missing, booking
and cancellation still work and email delivery is skipped.

```text
RESEND_API_KEY=
EMAIL_FROM=
MAHESH_NOTIFY_EMAIL=rudrapatimahesh@gmail.com
```
