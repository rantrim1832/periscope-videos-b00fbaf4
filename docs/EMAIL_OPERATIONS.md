# Email operations

Pariscope uses Resend for transactional/admin-triggered email.

## Required Supabase Edge Function secrets

Set these on the external Supabase project:

```bash
RESEND_API_KEY=<resend-api-key>
RESEND_FROM_EMAIL="Pariscope <hello@joinperiscope.com>"
RESEND_REPLY_TO="support@joinperiscope.com"
```

`RESEND_API_KEY` is private and must never be placed in Lovable/Vite/frontend
env. `RESEND_FROM_EMAIL` must use a domain/sender verified in Resend.

## Admin send endpoint

Function: `send-email`

- Requires a valid authenticated admin JWT.
- Sends through Resend.
- Intended for internal/admin flows first: test sends, claim outreach, support
  replies, and campaign tooling.

Example payload:

```json
{
  "to": "test@example.com",
  "subject": "Pariscope email test",
  "text": "This is a test from the external Supabase send-email function."
}
```

Future campaign features should call this function from admin-only UI or service
jobs, not directly from public forms.
