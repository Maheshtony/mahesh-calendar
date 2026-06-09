# Security And Access

## Access Model

Clients do not need login. The public booking page is intentionally open so clients from any timezone can book a meeting with Mahesh.

Mahesh/admin setup is private through environment variables for now. There is no admin UI in the MVP.

## Environment Variables

Environment variables are used for private setup:

```text
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_CALENDAR_ID=
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Only variables prefixed with `NEXT_PUBLIC_` are safe to expose to the browser.

Never expose these to frontend code:

- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_CALENDAR_ID`
- `SUPABASE_SERVICE_ROLE_KEY`

## Google Calendar Security

Google Calendar sync is server-side only.

Clients do not authenticate with Google. They do not need Google login. The server uses the configured service account after a local booking has already been saved.

If Google Calendar credentials are missing, the app skips sync safely and does not crash.

## Supabase Security

Supabase is optional production storage.

The service role key must only be used server-side. It should be configured in Vercel environment variables or `.env.local`, never in client components.

For the MVP, the server-side API controls booking creation and duplicate prevention.

## Local JSON Storage

Local JSON storage is for development and simple local testing.

Bookings are stored in:

```text
data/bookings.json
```

This is not durable enough for production serverless deployments. Use Supabase for production on Vercel.

## Validation

Current validation:

- name is required.
- valid email is required.
- slot is required.
- slot must be in the future.
- duplicate slot start times are rejected.

Validation is performed in the client for user experience and on the server for enforcement.

## Current Limitations

- No admin login.
- No rate limiting yet.
- No CAPTCHA yet.
- No email verification yet.
- No audit log yet.
- No cancellation flow yet.

These can be added later if actual usage requires them.

