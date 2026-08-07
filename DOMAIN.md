# Domain setup — opportunistic.online (Namecheap → GitHub Pages)

## 1. Namecheap DNS (Domain List → Manage → Advanced DNS)

Delete conflicting URL Redirect / Parking records on `@` and `www`, then add:

| Type  | Host | Value                     | TTL  |
|-------|------|---------------------------|------|
| A     | @    | 185.199.108.153           | Auto |
| A     | @    | 185.199.109.153           | Auto |
| A     | @    | 185.199.110.153           | Auto |
| A     | @    | 185.199.111.153           | Auto |
| CNAME | www  | FuturifyDesigns.github.io | Auto |

Save changes. DNS can take from a few minutes up to 24–48 hours.

## 2. GitHub Pages custom domain

Already configured via `public/CNAME` → `opportunistic.online`.

In the repo: **Settings → Pages → Custom domain** should show `opportunistic.online`.
Enable **Enforce HTTPS** after the certificate provisions (can take up to an hour after DNS works).

## 3. Supabase Auth redirects

In Supabase → Authentication → URL configuration, add:

- Site URL: `https://opportunistic.online`
- Redirect URLs:
  - `https://opportunistic.online/**`
  - `https://opportunistic.online/auth`
  - `https://futurifydesigns.github.io/Opportunistic/**` (optional backup)

## 4. Check

- https://opportunistic.online
- https://www.opportunistic.online (should follow GitHub / DNS)
- https://opportunistic.online/how-it-works
