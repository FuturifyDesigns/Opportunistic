import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const overlaysPath = path.join(__dirname, 'overlays.json')
const extraPath = path.join(__dirname, 'overlays-pages.json')

function merge(a, b) {
  const o = { ...a }
  for (const [k, v] of Object.entries(b || {})) {
    o[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(a[k] || {}, v) : v
  }
  return o
}

const base = JSON.parse(fs.readFileSync(overlaysPath, 'utf8'))
const extra = JSON.parse(fs.readFileSync(extraPath, 'utf8'))
const out = merge(base, extra)
fs.writeFileSync(overlaysPath, JSON.stringify(out, null, 2))
console.log('Merged page overlays for', Object.keys(extra).join(', '))
