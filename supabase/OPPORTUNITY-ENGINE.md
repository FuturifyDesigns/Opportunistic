# Opportunity engine setup

## What it does
- **Scholarships:** curated real programs filtered to the user’s **country / region**
- **Jobs:** live postings from **Remotive** + **Arbeitnow** APIs, scored to skills/field, plus country-targeted Indeed/LinkedIn/RemoteOK/ReliefWeb searches
- **Weekly refresh:** GitHub Action queues rematches; each user’s dashboard auto-refreshes if matches are older than 7 days (or when a `queued` search_run exists)

## Deploy the Edge Function
```bash
supabase functions deploy opportunity-engine
supabase secrets set CRON_SECRET=your-long-random-string
```

## GitHub secrets
- `SUPABASE_URL` — project URL
- `CRON_SECRET` — same value as above

## Client behaviour (already in app)
- Dashboard **Refresh from web** button → `runMatchingForUser`
- Auto-run when `shouldWeeklyRefresh(userId)` is true on dashboard load
