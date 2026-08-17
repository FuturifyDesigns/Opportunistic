/**
 * Post-build hardening for the static output:
 * - strip HTML comments (tooling / platform hints)
 * - inject CSP + security meta (with sha256 for any remaining inline scripts such as JSON-LD)
 * - fail if source maps or obvious secret/config files leaked into dist
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildCspMeta,
  PERMISSIONS_POLICY,
  REFERRER_POLICY,
} from './security-headers.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')

if (!fs.existsSync(dist)) {
  console.error('[security] dist/ missing — run vite build first')
  process.exit(1)
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

function sha256Base64(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('base64')
}

function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '')
}

function upsertMetaHttpEquiv(html, httpEquiv, content) {
  const re = new RegExp(`<meta\\s+http-equiv=["']${httpEquiv}["'][^>]*>`, 'i')
  const tag = `<meta http-equiv="${httpEquiv}" content="${content.replace(/"/g, '&quot;')}" />`
  if (re.test(html)) return html.replace(re, tag)
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`)
}

function upsertMetaName(html, name, content) {
  const re = new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, 'i')
  const tag = `<meta name="${name}" content="${content.replace(/"/g, '&quot;')}" />`
  if (re.test(html)) return html.replace(re, tag)
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`)
}

function collectInlineScriptHashes(html) {
  const hashes = []
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html))) {
    const body = m[1]
    if (!body.trim()) continue
    hashes.push(sha256Base64(body))
  }
  return hashes
}

const forbiddenNames = new Set([
  '.env',
  '.env.production',
  '.env.local',
  'readme.md',
  'package.json',
  'package-lock.json',
  'vite.config.js',
  'dockerfile',
])

let failures = 0
const files = walk(dist)
const htmlFiles = files.filter((f) => f.endsWith('.html'))

for (const file of files) {
  const base = path.basename(file).toLowerCase()
  if (file.endsWith('.map')) {
    console.error(`[security] source map leaked: ${path.relative(dist, file)}`)
    failures += 1
  }
  if (forbiddenNames.has(base)) {
    console.error(`[security] sensitive file in dist: ${path.relative(dist, file)}`)
    failures += 1
  }
}

const leakRe = /github\.io|netlify\.app|vercel\.app|gh-pages|x-github-request|pages\.github|server:\s*github/i

for (const file of files) {
  const ext = path.extname(file).toLowerCase()
  if (!['.html', '.js', '.css', '.json', '.txt', '.xml', '.webmanifest', '.svg'].includes(ext)) continue
  const text = fs.readFileSync(file, 'utf8')
  if (leakRe.test(text)) {
    console.error(`[security] host leak in ${path.relative(dist, file)}`)
    failures += 1
  }
}

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8')
  html = stripComments(html)

  const hashes = collectInlineScriptHashes(html)
  const csp = buildCspMeta({ scriptHashes: hashes })

  html = upsertMetaHttpEquiv(html, 'Content-Security-Policy', csp)
  html = upsertMetaHttpEquiv(html, 'X-Content-Type-Options', 'nosniff')
  html = upsertMetaName(html, 'referrer', REFERRER_POLICY)
  html = upsertMetaHttpEquiv(html, 'Permissions-Policy', PERMISSIONS_POLICY)

  if (leakRe.test(html)) {
    console.error(`[security] host leak in ${path.relative(dist, file)}`)
    failures += 1
  }

  fs.writeFileSync(file, html, 'utf8')
}

const securityTxt = path.join(dist, '.well-known', 'security.txt')
if (!fs.existsSync(securityTxt)) {
  console.error('[security] missing .well-known/security.txt in dist')
  failures += 1
}

console.log(
  `[security] hardened ${htmlFiles.length} HTML files; scanned ${files.length} artifacts.`,
)
if (failures) {
  console.error(`[security] ${failures} problem(s).`)
  process.exitCode = 1
} else {
  console.log('[security] OK')
}
