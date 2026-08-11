# Opportunistic

Worldwide scholarship and job matching with visible reasoning.

**Live:** https://opportunistic.online/

## Setup

1. Copy `.env.example` to `.env` and set your Supabase URL + anon key.
2. In the Supabase SQL Editor, run `supabase/migrations/001_initial_schema.sql`.
3. Under Authentication → URL configuration, set Site URL to `https://opportunistic.online` and add redirect URLs for `/auth`, `/verified`, and `http://localhost:5173/**`.
4. `npm install` then `npm run dev`

## Build

```bash
npm run build
```

Output is written to `dist/`. Production deploys run through CI on push to `main`. Edge security (HSTS, CSP, header stripping) is configured at the CDN — see `ops/CDN-SECURITY.md` and `DOMAIN.md`.

## Stack

- React + Vite + GSAP
- Supabase Auth, Postgres, RLS
- Cloudflare edge (TLS + security headers)
