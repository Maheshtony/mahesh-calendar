# Feature Tickets

## MVP Complete

### Ticket 1: Public Landing Page

Status: Done

Description:

Create a simple landing page for Mahesh Calendar with a call to action that routes clients to booking.

Acceptance Criteria:

- Shows `Mahesh Calendar`.
- Mentions booking a 30-minute meeting with Mahesh.
- Links to `/calendar`.

### Ticket 2: Calendar Booking Page

Status: Done

Description:

Create a public booking page where clients can select a date and view 30-minute slots.

Acceptance Criteria:

- Uses FullCalendar month view.
- Shows available future slots.
- Hides past slots.
- Shows booked slots as disabled.
- Shows visitor timezone.

### Ticket 3: Booking Form

Status: Done

Description:

Let clients book a selected slot with name, email, and notes.

Acceptance Criteria:

- Name required.
- Valid email required.
- Slot required.
- Notes optional.
- On success, client goes to confirmation page.

### Ticket 4: Local JSON Storage

Status: Done

Description:

Support local development storage through `data/bookings.json`.

Acceptance Criteria:

- Bookings are saved locally when Supabase is not configured.
- Duplicate start times are rejected.
- Existing bookings update availability.

### Ticket 5: Optional Google Calendar Sync

Status: Done

Description:

Attempt server-side Google Calendar event creation after a booking is saved.

Acceptance Criteria:

- Uses service account env vars.
- Clients do not need Google login.
- Missing env vars return skipped status.
- Booking still succeeds if sync is skipped or failed.

### Ticket 6: Optional Supabase Storage

Status: Done

Description:

Use Supabase `bookings` table for production storage when configured.

Acceptance Criteria:

- Supabase client is server-side only.
- Service role key is not exposed to frontend.
- Missing env vars fall back to local JSON.
- Duplicate `start_time` bookings are prevented.

## Suggested Next Tickets

### Ticket 7: Admin Availability Rules

Status: Backlog

Description:

Allow Mahesh to define working hours and unavailable dates instead of 24/7 availability.

Keep it simple:

- start with config-based availability.
- avoid building a full admin dashboard until needed.

### Ticket 8: Email Notifications

Status: Backlog

Description:

Send confirmation emails to clients and Mahesh after successful booking.

Notes:

- Use a low-cost provider.
- Keep email templates minimal.
- Do not block booking if email delivery fails.

### Ticket 9: Cancellation Flow

Status: Backlog

Description:

Allow clients to cancel a booking through a secure link.

Notes:

- Use a signed token or random cancellation token.
- Keep cancellation simple before adding rescheduling.

### Ticket 10: Basic Admin View

Status: Backlog

Description:

Create a private admin view for Mahesh to see bookings.

Notes:

- Do not add client login.
- Consider simple password or provider auth only when needed.

### Ticket 11: Production Hardening

Status: Backlog

Description:

Add light abuse protection and operational polish.

Possible work:

- rate limiting.
- CAPTCHA if spam appears.
- structured logging.
- better error monitoring.

