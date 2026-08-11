# Cloudflare setup — opportunistic.online (Namecheap)

Do these in order. Total time is usually 20–40 minutes once nameservers propagate
(can take up to a few hours).

## Before you start

- Cloudflare account: https://dash.cloudflare.com/sign-up (free plan is enough)
- Namecheap login for `opportunistic.online`
- Keep this tab open — you’ll paste nameservers and copy header values below

Your domain currently uses Namecheap DNS (`dns1/dns2.registrar-servers.com`).
After this, Cloudflare becomes the public DNS + TLS edge.

---

## Step 1 — Add the site in Cloudflare

1. Open https://dash.cloudflare.com → **Add a domain**
2. Enter `opportunistic.online` → continue
3. Choose the **Free** plan
4. Cloudflare scans existing DNS. Keep / add these records:

| Type  | Name | Content | Proxy status |
|-------|------|---------|--------------|
| A     | `@`  | `185.199.108.153` | **Proxied** (orange cloud) |
| A     | `@`  | `185.199.109.153` | **Proxied** |
| A     | `@`  | `185.199.110.153` | **Proxied** |
| A     | `@`  | `185.199.111.153` | **Proxied** |
| CNAME | `www`| `opportunistic.online` | **Proxied** |

Important:

- Delete any old `www` CNAME that points at an origin-platform hostname
  (anything ending in a vendor domain). Replace it with the row above.
- Delete parking / URL-redirect records on `@` or `www` if Cloudflare imported them.
- Every public web record must show the **orange** cloud, not grey.

5. Continue until Cloudflare shows **two nameservers**, for example:

   - `xxxx.ns.cloudflare.com`
   - `yyyy.ns.cloudflare.com`

   Copy both exactly.

---

## Step 2 — Point Namecheap at Cloudflare

1. Namecheap → **Domain List** → `opportunistic.online` → **Manage**
2. **Nameservers** → change from **Namecheap Basic DNS** to **Custom DNS**
3. Paste the two Cloudflare nameservers → save
4. Back in Cloudflare, click **Check nameservers** (or wait for email)

Propagation is often fast; allow up to 24h. Site may briefly flap while NS switch.

---

## Step 3 — SSL / TLS in Cloudflare

Go to **SSL/TLS** for the zone:

| Setting | Value |
|---------|--------|
| Encryption mode | **Full (strict)** |
| Edge Certificates → Always Use HTTPS | **On** |
| Automatic HTTPS Rewrites | **On** |
| Minimum TLS Version | **1.2** |
| TLS 1.3 | **On** |

If the site shows an SSL error for a few minutes after going orange, wait for
Cloudflare’s edge cert to finish provisioning, then retry. If **Full (strict)**
errors persist, temporarily use **Full** (not Flexible), never Flexible long-term.

Also enable:

- **SSL/TLS → Edge Certificates → Opportunistic Encryption** (On)
- **Security → Settings → Security Level**: Medium (default is fine)

---

## Step 4 — Security headers (Transform Rules)

1. Cloudflare → **Rules** → **Transform Rules** → **Modify Response Header**
2. **Create rule**
3. Name: `Opportunistic security headers`
4. Custom filter expression:

```txt
(http.host eq "opportunistic.online") or (http.host eq "www.opportunistic.online")
```

5. Then add these actions (Set static / Remove):

| Action | Header name | Value |
|--------|-------------|--------|
| Set static | `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| Set static | `X-Content-Type-Options` | `nosniff` |
| Set static | `X-Frame-Options` | `DENY` |
| Set static | `Referrer-Policy` | `strict-origin-when-cross-origin` |
| Set static | `Permissions-Policy` | `accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()` |
| Set static | `Cross-Origin-Opener-Policy` | `same-origin` |
| Set static | `Cross-Origin-Resource-Policy` | `same-origin` |
| Set static | `Content-Security-Policy` | *(paste the single-line CSP below)* |
| Remove | `Access-Control-Allow-Origin` | — |
| Remove | `x-github-request-id` | — |
| Remove | `x-github-edge-region` | — |
| Remove | `x-fastly-request-id` | — |
| Remove | `via` | — |
| Remove | `x-served-by` | — |
| Remove | `x-cache` | — |
| Remove | `x-cache-hits` | — |
| Remove | `x-timer` | — |
| Remove | `x-proxy-cache` | — |

CSP value (one line — paste exactly):

```
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests; img-src 'self' data: blob: https:; font-src 'self'; style-src 'self' 'unsafe-inline'; style-src-attr 'unsafe-inline'; script-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://remotive.com https://www.arbeitnow.com; worker-src 'self' blob:; manifest-src 'self'
```

6. Deploy the rule.

Optional second rule (or same rule if UI allows more removes): remove any
origin vendor request-id / edge-region response headers you still see in
`curl -sI https://opportunistic.online/`.

---

## Step 5 — www → apex redirect (recommended)

**Rules → Redirect Rules → Create rule**

- Name: `www to apex`
- If: hostname equals `www.opportunistic.online`
- Then: Dynamic redirect → `concat("https://opportunistic.online", http.request.uri.path)`  
  (or Static `https://opportunistic.online/` if your plan only allows simple redirects)
- Status: `301`
- Preserve query string: On

---

## Step 6 — Verify

From PowerShell:

```powershell
nslookup opportunistic.online
nslookup www.opportunistic.online
curl.exe -sI https://opportunistic.online/
curl.exe -sI https://www.opportunistic.online/
```

You want:

- DNS answers that are **Cloudflare anycast IPs** (not the raw `185.199.*` list to the public — with proxy on, Cloudflare answers with its own IPs)
- `server: cloudflare`
- `strict-transport-security: ...`
- `content-security-policy: ...`
- **No** `access-control-allow-origin: *`
- **No** public CNAME naming the origin platform for `www`

Also open https://opportunistic.online/ and sign in once (Google OAuth) to confirm auth redirects still work.

---

## If something breaks

| Symptom | Fix |
|---------|-----|
| Site down after NS change | Wait for propagation; confirm Cloudflare DNS has the four A records + www CNAME, all Proxied |
| SSL interstitial / 526 | Use SSL mode **Full** briefly, confirm origin HTTPS works, then back to **Full (strict)** |
| OAuth bounce fails | Supabase redirect URLs must include `https://opportunistic.online/**` and `/auth` |
| Headers missing | Transform Rule filter must match both hosts; rule must be **Deployed** |
| Still see origin hostname in DNS | `www` CNAME is wrong — must be `opportunistic.online` (proxied), not a vendor hostname |

When verification looks good, tell the assistant — they can re-check live headers for you.
