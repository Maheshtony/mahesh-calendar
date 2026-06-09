# Frontend Spec

## Brand

App name:

```text
Mahesh Calendar
```

Subtitle:

```text
Book a 30-minute meeting with Mahesh
```

The UI should feel clean, professional, and Calendly-style without becoming complex.

## Pages

### Landing Page

Route:

```text
/
```

Purpose:

- Introduce Mahesh Calendar.
- Explain that clients can book a 30-minute meeting.
- Link to the calendar page.

Primary action:

```text
View Availability
```

### Calendar Page

Route:

```text
/calendar
```

Purpose:

- Show the FullCalendar month view.
- Let clients select a date.
- Show available 30-minute time slots.
- Show disabled booked slots.
- Provide booking form.

Required text:

```text
Times shown in your timezone: <timezone>
```

Required status note:

```text
Bookings are saved securely. Available slots update after booking.
```

### Confirmation Page

Route:

```text
/confirmation?id=<bookingId>
```

Purpose:

- Confirm the booking.
- Show booked date/time.
- Show visitor timezone.
- Show Google Calendar sync status.

Required confirmation message:

```text
Your meeting request has been booked.
```

## Booking Form

Fields:

- name, required.
- email, required and valid email format.
- notes, optional.

Submission behavior:

- slot is required.
- booking is sent to `/api/bookings`.
- on success, navigate to confirmation page.
- on duplicate booking, show a readable error.

## Calendar Behavior

- Month view is the primary view.
- Client clicks/selects a date.
- Slots are shown for the selected date.
- Slot duration is 30 minutes.
- Owner availability is every day, 24 hours per day for now.
- Past slots are hidden.
- Booked slots are disabled.

## Responsive Behavior

Desktop:

- Calendar uses most of the page.
- Booking form sits in a right-side panel.

Mobile:

- Calendar and booking panel stack vertically.
- Slot buttons remain easy to tap.
- Text should not overflow buttons or panels.

## Visual Style

- Professional and simple.
- Rounded corners are modest.
- Avoid heavy decorative elements.
- Use clear available and disabled states.
- Keep the booking path obvious.

