# Security notes

## Production controls (in repo)

- Document CSP + meta hardening: `scripts/security-headers.mjs`, `scripts/inject-security.mjs` (runs on every `npm run build`)
- `public/.well-known/security.txt` — vulnerability disclosure contact
- Self-hosted fonts (no third-party font CDN)
- No production source maps
- Client rate gate on job-feed fetches (`src/lib/rateLimit.js`)
- Auth: Supabase PKCE; session in `localStorage` under `opp-auth` (not cookies)

## Edge controls (required — not optional)

Meta tags cannot set HSTS or `frame-ancestors`. Origin also cannot hide its
identity. Configure Cloudflare per `ops/CDN-SECURITY.md` and `DOMAIN.md`:

1. Proxied DNS for `@` and `www`
2. Transform Rules for HSTS, CSP, COOP/CORP, strip open CORS + origin headers
3. SSL Full (strict), Always HTTPS

Until the orange cloud is on, browsers still see origin IPs and `Server` headers.

## Known non-production advisory

`npm audit` may report a Vite/esbuild issue that only affects the **local
dev server**, not the production static build. Do not force-upgrade Vite solely
for that advisory without testing.
