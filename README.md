# Opportunistic

Worldwide scholarship and job matching with visible reasoning — React (Vite) + Supabase, deployed on GitHub Pages.

**Live:** https://futurifydesigns.github.io/Opportunistic/

## Setup

1. Copy `.env.example` to `.env` and set your Supabase URL + anon key.
2. In the [Supabase SQL Editor](https://supabase.com/dashboard/project/xtvrjamnorcaevnvvnez/sql), run `supabase/migrations/001_initial_schema.sql`.
3. Under Authentication → URL configuration, add:
   - Site URL: `https://futurifydesigns.github.io/Opportunistic/`
   - Redirect URLs: `https://futurifydesigns.github.io/Opportunistic/**` and `http://localhost:5173/**`
4. `npm install` then `npm run dev`

## Deploy

```bash
npm run deploy
```

This builds with `base: /Opportunistic/` and pushes the `dist` folder to the `gh-pages` branch.

## Matching (current)

Phase 1 ships a profile-aware matcher that scores curated scholarship boards and job search links with personalized reasoning, then stores results in Supabase. Phase 2 replaces this with SearXNG + Edge Function LLM scoring per the build plan.

## Stack

- React + Vite + GSAP
- Supabase Auth, Postgres, RLS
- GitHub Pages
