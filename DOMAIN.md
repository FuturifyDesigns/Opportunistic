# Domain & edge — opportunistic.online

Public traffic must terminate on Cloudflare (proxied DNS). Origin hosting stays
private; browsers, DNS, WHOIS, TLS, and response headers should only show the
custom domain and Cloudflare.

## 1. Cloudflare DNS

| Type  | Name | Target                         | Proxy    |
|-------|------|--------------------------------|----------|
| A / CNAME | `@` | origin addresses / hostname | Proxied  |
| CNAME | `www` | `opportunistic.online`         | Proxied  |

Enable registrar/WHOIS privacy. Do not publish CNAMEs that name the origin
platform.

Full header/TLS checklist: [`ops/CDN-SECURITY.md`](ops/CDN-SECURITY.md).

## 2. Auth redirects (Supabase)

Site URL: `https://opportunistic.online`

Redirect URLs:

- `https://opportunistic.online/**`
- `https://opportunistic.online/auth`
- `https://opportunistic.online/verified`
- `http://localhost:5173/**` (local only)

## 3. Checks

- `https://opportunistic.online` and `https://www.opportunistic.online`
- Response headers include HSTS + CSP (via Cloudflare Transform Rules)
- `nslookup` shows Cloudflare anycast IPs, not origin platform addresses
