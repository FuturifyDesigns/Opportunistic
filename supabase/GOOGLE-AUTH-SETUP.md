# Google sign-in setup (Opportunistic)

Use this with **Supabase Auth** (not a custom Google backend). Your app already calls `signInWithOAuth({ provider: 'google' })`.

## 1. Google Cloud — OAuth client (Web application)

Project: `opportunistic-504817`  
Create client → **Web application** → name `Opportunistic`

### Authorized JavaScript origins

```
https://opportunistic.online
http://localhost:5173
http://127.0.0.1:5173
```

### Authorized redirect URIs

Paste **exactly** this Supabase callback (not your website URL):

```
https://xtvrjamnorcaevnvvnez.supabase.co/auth/v1/callback
```

Then **Create**. Copy the **Client ID** and **Client secret**.

## 2. Supabase Dashboard

Open: [Auth → Providers → Google](https://supabase.com/dashboard/project/xtvrjamnorcaevnvvnez/auth/providers)

1. Enable **Google**
2. Paste Client ID + Client secret
3. Save

Then [Auth → URL configuration](https://supabase.com/dashboard/project/xtvrjamnorcaevnvvnez/auth/url-configuration):

- **Site URL:** `https://opportunistic.online`
- **Redirect URLs** (add all):

```
https://opportunistic.online/**
https://opportunistic.online/auth
http://localhost:5173/**
http://localhost:5173/auth
http://127.0.0.1:5173/**
http://127.0.0.1:5173/auth
```

## 3. Google OAuth consent screen

Under **Google Auth Platform → Audience / Branding**:

- App name: Opportunistic
- User support email: yours
- Authorized domains should include `opportunistic.online` and `supabase.co` (Google often adds domains from the URIs automatically)
- For testing, keep **External** + add your Google account as a test user until the app is verified

## 4. Test

1. Open https://opportunistic.online/auth → Sign in or Sign up form
2. Click **Continue with Google**
3. After Google, you should land on **onboarding** (new account) or **dashboard** (existing, completed onboarding) — not “Choose a portal”

If you bounce back to Choose a portal with no session, confirm Redirect URLs include `https://opportunistic.online/auth` and hard-refresh after deploy (OAuth `?code=` must survive the GitHub Pages SPA redirect).

## Notes

- Do **not** put the Client secret in the Vite frontend. Only Supabase stores it.
- Redirect URI mistakes are the #1 failure. It must be the `…supabase.co/auth/v1/callback` URL.
- Localhost only works if both Google origins and Supabase redirect allowlists include localhost.
