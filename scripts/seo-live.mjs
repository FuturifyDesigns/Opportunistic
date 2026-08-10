/**
 * Live smoke test against the deployed site: every indexable URL must answer 200,
 * and the favicon / sitemap / share image must be publicly fetchable.
 * Run with: node scripts/seo-live.mjs
 */

import { SEO_ROUTES, SITE_URL } from '../src/lib/seoRoutes.js'

const assets = ['/favicon.ico', '/favicon-48.png', '/og-image.png', '/robots.txt', '/sitemap.xml', '/site.webmanifest']
const targets = [
  ...SEO_ROUTES.map((r) => (r.path === '/' ? '/' : r.path)),
  ...assets,
]

let bad = 0

for (const target of targets) {
  const url = `${SITE_URL}${target}`
  try {
    const res = await fetch(url, { redirect: 'manual' })
    const type = res.headers.get('content-type') || ''
    const ok = res.status === 200 || (res.status >= 300 && res.status < 400)
    if (!ok) bad += 1
    const loc = res.headers.get('location')
    console.log(
      `${ok ? 'OK  ' : 'BAD '} ${String(res.status).padEnd(3)} ${target.padEnd(16)} ${type.split(';')[0]}${loc ? ` → ${loc}` : ''}`,
    )
  } catch (err) {
    bad += 1
    console.log(`BAD ERR ${target} :: ${err.message}`)
  }
}

console.log(bad ? `\n${bad} URL(s) not serving correctly.` : '\nAll live URLs healthy.')
process.exitCode = bad ? 1 : 0
