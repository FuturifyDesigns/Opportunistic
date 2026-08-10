/**
 * Live smoke test against the deployed site: every indexable URL must answer 200,
 * and the favicon / sitemap / share image must be publicly fetchable.
 * Run with: node scripts/seo-live.mjs
 */

import { SEO_ROUTES, SITE_URL, canonicalFor } from '../src/lib/seoRoutes.js'

const assets = ['/favicon.ico', '/favicon-48.png', '/og-image.png', '/robots.txt', '/sitemap.xml', '/site.webmanifest']
const targets = [
  // Canonical URLs must answer 200 directly, with no redirect hop.
  ...SEO_ROUTES.map((r) => canonicalFor(r.path)),
  ...assets.map((a) => `${SITE_URL}${a}`),
]

let bad = 0

for (const url of targets) {
  const label = url.replace(SITE_URL, '') || '/'
  try {
    const res = await fetch(url, { redirect: 'manual' })
    const type = res.headers.get('content-type') || ''
    const loc = res.headers.get('location')
    const ok = res.status === 200
    if (!ok) bad += 1
    console.log(
      `${ok ? 'OK  ' : 'BAD '} ${String(res.status).padEnd(3)} ${label.padEnd(18)} ${type.split(';')[0]}${loc ? ` → ${loc}` : ''}`,
    )
  } catch (err) {
    bad += 1
    console.log(`BAD ERR ${label} :: ${err.message}`)
  }
}

console.log(bad ? `\n${bad} URL(s) not serving correctly.` : '\nAll live URLs healthy.')
process.exitCode = bad ? 1 : 0
