/**
 * One-off generator for the 1200x630 social share image (public/og-image.png).
 * Re-run with: node scripts/make-og-image.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'public', 'og-image.png')
const markPath = path.join(root, 'public', 'logo-512.png')

const W = 1200
const H = 630

const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="glow" cx="12%" cy="0%" r="85%">
      <stop offset="0%" stop-color="#0b6e4f" stop-opacity="0.18" />
      <stop offset="60%" stop-color="#0b6e4f" stop-opacity="0.03" />
      <stop offset="100%" stop-color="#0b6e4f" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#f6f6f4" />
  <rect width="${W}" height="${H}" fill="url(#glow)" />
  <rect x="0" y="${H - 10}" width="${W}" height="10" fill="#0b6e4f" />
</svg>`)

const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <style>
    .eyebrow { font-family: 'Segoe UI', 'IBM Plex Sans', Arial, sans-serif; font-size: 26px; font-weight: 600; letter-spacing: 4px; fill: #0b6e4f; }
    .title { font-family: 'Segoe UI', 'IBM Plex Sans', Arial, sans-serif; font-size: 68px; font-weight: 700; fill: #0a0a0a; }
    .sub { font-family: 'Segoe UI', 'IBM Plex Sans', Arial, sans-serif; font-size: 32px; font-weight: 400; fill: #4a4a48; }
    .url { font-family: 'Segoe UI', 'IBM Plex Sans', Arial, sans-serif; font-size: 26px; font-weight: 600; fill: #0b6e4f; }
  </style>
  <text class="eyebrow" x="96" y="188">OPPORTUNISTIC</text>
  <text class="title" x="96" y="286">Scholarships &amp; jobs,</text>
  <text class="title" x="96" y="366">matched to you.</text>
  <text class="sub" x="96" y="436">Ranked by your degree, skills, and country —</text>
  <text class="sub" x="96" y="480">with reasons on every card.</text>
  <text class="url" x="96" y="558">opportunistic.online</text>
</svg>`)

// The brand mark is white, so it needs a dark badge to stay visible on cream.
const BADGE = 260
const MARK = 168
const badge = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE}" height="${BADGE}">
  <rect width="${BADGE}" height="${BADGE}" rx="56" fill="#0a0a0a" />
</svg>`)

const mark = await sharp(markPath)
  .resize(MARK, MARK, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()

const badgeWithMark = await sharp(badge)
  .composite([{ input: mark, top: (BADGE - MARK) / 2, left: (BADGE - MARK) / 2 }])
  .png()
  .toBuffer()

await sharp(background)
  .composite([
    { input: text, top: 0, left: 0 },
    { input: badgeWithMark, top: Math.round((H - BADGE) / 2) - 10, left: W - BADGE - 110 },
  ])
  .png()
  .toFile(out)

const meta = await sharp(out).metadata()
console.log(`[og] wrote ${path.relative(root, out)} ${meta.width}x${meta.height} (${fs.statSync(out).size} bytes)`)
