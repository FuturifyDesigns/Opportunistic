/**
 * Static hosts often lack path rewrites, so SPA routes without a real file
 * used to answer HTTP 404 and could not be indexed.
 *
 * This writes a real index.html for each route (200 OK) with route-specific
 * title/description/canonical/OG tags, plus a crawlable <noscript> summary.
 * robots.txt and sitemap.xml are generated here too (rather than kept in public/)
 * so they can never drift from the route table in src/lib/seoRoutes.js.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SEO_ROUTES,
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  INDEXABLE_ROUTES,
  canonicalFor,
} from '../src/lib/seoRoutes.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const shellPath = path.join(dist, 'index.html')

if (!fs.existsSync(shellPath)) {
  console.error('[prerender] dist/index.html missing — run vite build first.')
  process.exit(1)
}

const shell = fs.readFileSync(shellPath, 'utf8')

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
}

function setMetaName(html, name, content) {
  const pattern = new RegExp(`<meta\\s+name="${name}"[\\s\\S]*?/>`, 'i')
  const tag = `<meta name="${name}" content="${escapeHtml(content)}" />`
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

function setMetaProperty(html, property, content) {
  const pattern = new RegExp(`<meta\\s+property="${property}"[\\s\\S]*?/>`, 'i')
  const tag = `<meta property="${property}" content="${escapeHtml(content)}" />`
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

function setCanonical(html, href) {
  const pattern = /<link\s+rel="canonical"[\s\S]*?\/>/i
  const tag = `<link rel="canonical" href="${href}" />`
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

function noscriptBlock(route) {
  const links = INDEXABLE_ROUTES.filter((r) => r.path !== route.path)
    .map((r) => {
      const href = r.path === '/' ? '/' : `${r.path}/`
      const label = escapeHtml(r.title.split('|')[0].split('—')[0].trim())
      return `<li><a href="${href}">${label}</a></li>`
    })
    .join('')

  return `    <noscript>
      <div class="noscript-seo">
        <h1>${escapeHtml(route.heading || route.title)}</h1>
        <p>${escapeHtml(route.body || route.description || '')}</p>
        <nav aria-label="Pages"><ul>${links}</ul></nav>
        <p>Opportunistic needs JavaScript enabled to run the matching engine.</p>
      </div>
    </noscript>
`
}

function buildPage(route) {
  const canonical = canonicalFor(route.canonicalPath || route.path)
  let html = shell

  html = setTitle(html, route.title)

  if (route.description) {
    html = setMetaName(html, 'description', route.description)
    html = setMetaProperty(html, 'og:description', route.description)
    html = setMetaName(html, 'twitter:description', route.description)
  }

  html = setCanonical(html, canonical)
  html = setMetaProperty(html, 'og:url', canonical)
  html = setMetaProperty(html, 'og:title', route.title)
  html = setMetaName(html, 'twitter:title', route.title)
  html = setMetaProperty(html, 'og:image', DEFAULT_OG_IMAGE)
  html = setMetaName(html, 'twitter:image', DEFAULT_OG_IMAGE)
  html = setMetaName(
    html,
    'robots',
    route.index ? 'index, follow, max-image-preview:large' : 'noindex, follow',
  )

  if (route.index) {
    html = html.replace('<div id="root"></div>', `<div id="root"></div>\n${noscriptBlock(route)}`)
  }

  return html
}

let written = 0
for (const route of SEO_ROUTES) {
  const html = buildPage(route)
  if (route.path === '/') {
    fs.writeFileSync(shellPath, html, 'utf8')
  } else {
    const dir = path.join(dist, route.path.replace(/^\//, ''))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
  }
  written += 1
}

const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${INDEXABLE_ROUTES.map(
  (r) => `  <url>
    <loc>${canonicalFor(r.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq || 'monthly'}</changefreq>
    <priority>${r.priority || '0.5'}</priority>
  </url>`,
).join('\n')}
</urlset>
`
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap, 'utf8')

const robots = `# ${SITE_NAME}
User-agent: *
Allow: /

# Signed-in areas hold no crawlable content
Disallow: /dashboard
Disallow: /onboarding
Disallow: /profile
Disallow: /settings
Disallow: /admin
Disallow: /match/
Disallow: /verified

Sitemap: ${SITE_URL}/sitemap.xml
`
fs.writeFileSync(path.join(dist, 'robots.txt'), robots, 'utf8')

console.log(
  `[prerender] ${written} route pages, sitemap with ${INDEXABLE_ROUTES.length} URLs, robots.txt written.`,
)
