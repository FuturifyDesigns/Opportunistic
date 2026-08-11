# Edge security (Cloudflare)

The public site must be served only through a CDN/proxy that terminates TLS
and sets security headers. Origin IPs and origin response headers must never
be visible to browsers.

## 1. DNS (proxied)

1. Add the zone for `opportunistic.online` in Cloudflare.
2. Point registrar nameservers at Cloudflare.
3. Create records with the **orange cloud (Proxied)** enabled:

| Type  | Name | Target                                      | Proxy |
|-------|------|---------------------------------------------|-------|
| A/AAAA or CNAME | `@` | your origin static hostname / addresses | Proxied |
| CNAME | `www` | `opportunistic.online`                      | Proxied |

Do **not** publish a public CNAME that names the underlying origin platform.
Visitors and WHOIS/DNS lookups should only see Cloudflare.

Enable Cloudflare WHOIS privacy / registrar privacy if the domain is moved
or updated at the registrar.

## 2. SSL/TLS

- Mode: **Full (strict)**
- Always Use HTTPS: On
- Automatic HTTPS Rewrites: On
- Minimum TLS: 1.2
- Opportunistic Encryption / TLS 1.3: On

## 3. Transform Rules → Modify Response Header

Create a rule matching `http.host eq "opportunistic.online" or http.host eq "www.opportunistic.online"` and set:

| Action | Header | Value |
|--------|--------|-------|
| Set | `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| Set | `X-Content-Type-Options` | `nosniff` |
| Set | `X-Frame-Options` | `DENY` |
| Set | `Referrer-Policy` | `strict-origin-when-cross-origin` |
| Set | `Permissions-Policy` | `accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()` |
| Set | `Cross-Origin-Opener-Policy` | `same-origin` |
| Set | `Cross-Origin-Resource-Policy` | `same-origin` |
| Set | `Content-Security-Policy` | *(see below — keep in sync with `scripts/security-headers.mjs`)* |
| Remove | `Access-Control-Allow-Origin` | — |
| Remove | *(any origin-identifying headers)* | Strip `Server` overrides if exposed; drop vendor request-id / edge-region headers from origin |

Recommended CSP (single line):

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests; img-src 'self' data: blob: https:; font-src 'self'; style-src 'self' 'unsafe-inline'; style-src-attr 'unsafe-inline'; script-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://remotive.com https://www.arbeitnow.com; worker-src 'self' blob:; manifest-src 'self'
```

`style-src 'unsafe-inline'` is required for animation libraries that set
element styles. There must be **no** third-party script CDNs.

## 4. Verify

```bash
curl -sI https://opportunistic.online/ | findstr /I "strict-transport content-security server x-frame"
nslookup opportunistic.online
nslookup www.opportunistic.online
```

Expect Cloudflare IPs / `server: cloudflare`, HSTS present, and no origin
platform names in DNS or headers.
