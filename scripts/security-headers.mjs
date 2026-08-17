/**
 * Shared Content-Security-Policy and related document meta.
 * Keep the Cloudflare Transform Rule in ops/CDN-SECURITY.md in sync with CSP_POLICY.
 */

export const SUPABASE_CONNECT = 'https://*.supabase.co wss://*.supabase.co'
export const JOB_FEED_CONNECT = 'https://remotive.com https://www.arbeitnow.com'
export const CLOUDFLARE_ANALYTICS_SCRIPT = 'https://static.cloudflareinsights.com'
export const CLOUDFLARE_ANALYTICS_CONNECT = 'https://cloudflareinsights.com'

/** Response-header CSP (supports frame-ancestors). Prefer this at the CDN edge. */
export function buildCspHeader({ scriptHashes = [] } = {}) {
  const scriptSrc = ["'self'", ...scriptHashes.map((h) => `'sha256-${h}'`)].join(' ')
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    'upgrade-insecure-requests',
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "style-src-attr 'unsafe-inline'",
    `script-src ${scriptSrc} ${CLOUDFLARE_ANALYTICS_SCRIPT}`,
    `connect-src 'self' ${SUPABASE_CONNECT} ${JOB_FEED_CONNECT} ${CLOUDFLARE_ANALYTICS_CONNECT}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join('; ')
}

/**
 * Meta-delivered CSP cannot include frame-ancestors / report-uri.
 * Used as defense-in-depth when the edge rule is not yet active.
 */
export function buildCspMeta({ scriptHashes = [] } = {}) {
  return buildCspHeader({ scriptHashes })
    .split('; ')
    .filter((d) => !d.startsWith('frame-ancestors'))
    .join('; ')
}

export const PERMISSIONS_POLICY =
  'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()'

export const REFERRER_POLICY = 'strict-origin-when-cross-origin'
