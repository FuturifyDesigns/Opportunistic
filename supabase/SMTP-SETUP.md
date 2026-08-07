# Custom SMTP (Brevo) + branded Auth emails

## Security first
The SMTP password was shared in chat. **Rotate it in Brevo** (SMTP & API → generate a new SMTP key), then update `.env.smtp.local` and the Supabase dashboard. Never commit that file.

Credentials live only in: `.env.smtp.local` (gitignored).

## Connect Brevo → Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project `xtvrjamnorcaevnvvnez`
2. **Authentication → Emails → SMTP Settings** (or **Project Settings → Authentication → SMTP**)
3. Enable **Custom SMTP** and fill:

| Field | Value |
|--------|--------|
| Sender email | `hello@opportunistic.online` (must be verified/allowed in Brevo) |
| Sender name | `Opportunistic` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | from `.env.smtp.local` → `BREVO_SMTP_USER` |
| Password | from `.env.smtp.local` → `BREVO_SMTP_PASS` |

4. Save. Send a test signup to confirm delivery.

### Brevo sender setup
- In Brevo, verify `opportunistic.online` (or at least the sender address).
- Prefer sending as `hello@opportunistic.online` or `noreply@opportunistic.online` once DNS (SPF/DKIM) is done in Brevo.

## Branded email templates

HTML ready to paste is in `supabase/email-templates/`:

| File | Supabase template |
|------|-------------------|
| `confirm-signup.html` | Confirm signup |
| `magic-link.html` | Magic link |
| `reset-password.html` | Reset password |
| `change-email.html` | Change email address |
| `invite-user.html` | Invite user |

For each: **Authentication → Email Templates** → select type → paste Subject + Body from the matching files.

Logo URL used in templates: `https://opportunistic.online/logo.png`  
(Fallback while DNS settles: `https://futurifydesigns.github.io/Opportunistic/logo.png` — swap in the HTML if needed.)
