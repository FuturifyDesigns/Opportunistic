# Opportunistic security checklist

## Already in the app
- Supabase PKCE auth, session refresh, anon key only in the browser
- Row Level Security: users can only read/write their own rows
- Cookie consent with `Secure` + `SameSite=Lax` on HTTPS
- Meta CSP + Permissions-Policy in `index.html` (defense in depth)
- Cron edge function requires `x-cron-secret`; CORS locked to app origins
- Account delete calls Edge Function that removes `auth.users` (not just app tables)

## You should verify in Supabase Dashboard
1. Auth → URL configuration: only `https://opportunistic.online` and local dev URLs
2. Auth → Providers → Google: client secret only in Supabase (never in the SPA)
3. Auth → Settings: enable email confirmation for production if you want stricter signup
4. Database → Advisors: fix any RLS / security warnings
5. Edge Functions secrets: `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (auto), Stripe keys if billing is live

## Cloudflare (recommended — GitHub Pages cannot set real HTTP headers)
Proxy `opportunistic.online` through Cloudflare and add response headers:

- `Content-Security-Policy` — see `public/_headers`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`

## GitHub Actions secrets (Pages deploy)
Set repository secrets used by `.github/workflows/deploy.yml`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Keep a local `.env.production` for `npm run deploy` (gitignored). Never commit service-role or Stripe secrets.
