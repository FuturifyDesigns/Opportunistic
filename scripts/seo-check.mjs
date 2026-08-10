/**
 * Post-build sanity check: confirms every route emits a real HTML file with
 * the right title, description, canonical, and robots directive.
 * Run with: node scripts/seo-check.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEO_ROUTES, SITE_URL } from '../src/lib/seoRoutes.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')

const pick = (html, re) => {
  const m = html.match(re)
  return m ? m[0].replace(/\s+/g, ' ') : null
}

let failures = 0
const fail = (msg) => {
  failures += 1
  console.log(`  FAIL ${msg}`)
}

for (const route of SEO_ROUTES) {
  const file =
    route.path === '/'
      ? path.join(dist, 'index.html')
      : path.join(dist, route.path.replace(/^\//, ''), 'index.html')

  console.log(`\n${route.path}  →  ${path.relative(dist, file)}`)

  if (!fs.existsSync(file)) {
    fail('file missing (route would return HTTP 404 on GitHub Pages)')
    continue
  }

  const html = fs.readFileSync(file, 'utf8')
  const canonical = route.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${route.path}`
  const expectedRobots = route.index ? 'index, follow, max-image-preview:large' : 'noindex, follow'

  const title = pick(html, /<title>[\s\S]*?<\/title>/)
  const robots = pick(html, /<meta name="robots"[\s\S]*?\/>/)
  const canon = pick(html, /<link rel="canonical"[\s\S]*?\/>/)
  const desc = pick(html, /<meta name="description"[\s\S]*?\/>/)

  console.log(`  ${title}`)
  console.log(`  ${canon}`)
  console.log(`  ${robots}`)

  if (!title?.includes(route.title.replace(/&/g, '&amp;'))) fail(`title mismatch, got ${title}`)
  if (!canon?.includes(`"${canonical}"`)) fail(`canonical should be ${canonical}`)
  if (!robots?.includes(expectedRobots)) fail(`robots should be "${expectedRobots}"`)
  if (route.index && !desc) fail('indexable page has no meta description')
  if (route.index && !html.includes('noscript-seo')) fail('indexable page has no noscript fallback')
  if (!/<script type="module" crossorigin src="\/assets\//.test(html)) fail('app bundle not linked')
  if (!html.includes('rel="icon" href="/favicon.ico"')) fail('favicon.ico link missing')
}

for (const asset of ['favicon.ico', 'favicon-48.png', 'og-image.png', 'site.webmanifest', 'sitemap.xml', 'robots.txt', 'CNAME', '404.html']) {
  if (!fs.existsSync(path.join(dist, asset))) fail(`dist/${asset} missing`)
}

console.log(failures ? `\n${failures} problem(s) found.` : '\nSEO check passed.')
process.exitCode = failures ? 1 : 0
