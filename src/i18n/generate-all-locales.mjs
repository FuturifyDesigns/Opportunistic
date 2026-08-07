/**
 * Generate FULL locale JSON for every catalog language from en.json.
 * Resumable + sharded. Cache hits skip already-translated strings.
 *
 * node src/i18n/generate-all-locales.mjs
 * SHARD=0 SHARDS=4 node src/i18n/generate-all-locales.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import translate from 'google-translate-api-x'
import { LANGUAGES } from './languages.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.join(__dirname, 'locales')
const cachePath = path.join(__dirname, '.translate-cache.json')
const progressPath = path.join(__dirname, '.translate-progress.json')
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'))

const SHARD = Number(process.env.SHARD || 0)
const SHARDS = Math.max(1, Number(process.env.SHARDS || 1))

const GOOGLE_MAP = {
  zh: 'zh-CN',
  'zh-TW': 'zh-TW',
  'pt-BR': 'pt',
  fil: 'tl',
  tl: 'tl',
  nb: 'no',
  nn: 'no',
  he: 'iw',
  jv: 'jw',
  nso: 'st',
  nr: 'zu',
  ss: 'zu',
  ve: 'zu',
  ts: 'zu',
  ceb: 'tl',
  ht: 'ht',
  ku: 'ku',
  yi: 'yi',
}

const KEEP_AS_IS = new Set([
  'common.brand',
  'onboarding.assistantTitle',
])

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else out[key] = String(v ?? '')
  }
  return out
}

function unflatten(flat) {
  const root = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let cur = root
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] || {}
      cur = cur[parts[i]]
    }
    cur[parts[parts.length - 1]] = value
  }
  return root
}

function loadJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function protect(text) {
  const map = []
  let masked = String(text).replace(/\{\{[^}]+\}\}/g, (m) => {
    const i = map.length
    map.push(m)
    return `⟦${i}⟧`
  })
  masked = masked.replace(/\bOpportunistic\b/g, (m) => {
    const i = map.length
    map.push(m)
    return `⟦${i}⟧`
  })
  return { masked, map }
}

function unprotect(text, map) {
  return String(text)
    .replace(/⟦(\d+)⟧/g, (_, n) => map[Number(n)] || '')
    .replace(/\{\s*\{\s*/g, '{{')
    .replace(/\s*\}\s*\}/g, '}}')
}

async function translateBatch(texts, to, cache) {
  const target = GOOGLE_MAP[to] || to
  const results = new Array(texts.length)
  const needIdx = []
  const needTexts = []

  texts.forEach((t, i) => {
    const { masked, map } = protect(t)
    const ck = `${to}::${masked}`
    if (cache[ck]) {
      results[i] = unprotect(cache[ck], map)
    } else if (!masked.trim()) {
      results[i] = t
    } else {
      needIdx.push(i)
      needTexts.push({ masked, map, ck })
    }
  })

  const CHUNK = 15
  for (let start = 0; start < needTexts.length; start += CHUNK) {
    const slice = needTexts.slice(start, start + CHUNK)
    const inputs = slice.map((s) => s.masked)
    let attempt = 0
    while (attempt < 6) {
      try {
        const res = await translate(inputs, {
          from: 'en',
          to: target,
          forceBatch: true,
          rejectOnPartialFail: false,
        })
        const arr = Array.isArray(res) ? res : [res]
        for (let j = 0; j < slice.length; j++) {
          const meta = slice[j]
          const r = arr[j]
          const text = r == null ? null : typeof r === 'string' ? r : r.text
          if (!text) {
            try {
              const one = await translate(meta.masked, { from: 'en', to: target })
              cache[meta.ck] = one.text
              results[needIdx[start + j]] = unprotect(one.text, meta.map)
              await sleep(120)
            } catch {
              results[needIdx[start + j]] = texts[needIdx[start + j]]
            }
            continue
          }
          cache[meta.ck] = text
          results[needIdx[start + j]] = unprotect(text, meta.map)
        }
        break
      } catch (e) {
        attempt += 1
        const msg = e.message || ''
        console.warn(`  batch fail ${to} @${start}: ${msg.slice(0, 80)}`)
        const backoff = msg.includes('Too Many') ? 4000 * attempt : 1000 * attempt
        await sleep(backoff + SHARD * 500)
        if (attempt >= 6) {
          for (let j = 0; j < slice.length; j++) {
            try {
              const one = await translate(slice[j].masked, { from: 'en', to: target })
              cache[slice[j].ck] = one.text
              results[needIdx[start + j]] = unprotect(one.text, slice[j].map)
              await sleep(150)
            } catch {
              results[needIdx[start + j]] = texts[needIdx[start + j]]
            }
          }
        }
      }
    }
    await sleep(250 + SHARD * 150)
  }
  return results
}

async function buildLocale(code, flatEn, cache, existingFlat = {}) {
  const keys = Object.keys(flatEn)
  const flat = {}
  const needKeys = []

  for (const k of keys) {
    if (KEEP_AS_IS.has(k)) {
      flat[k] = flatEn[k]
      continue
    }
    const { masked, map } = protect(flatEn[k])
    const ck = `${code}::${masked}`
    if (cache[ck]) {
      flat[k] = unprotect(cache[ck], map)
    } else if (existingFlat[k]) {
      flat[k] = existingFlat[k]
    } else {
      needKeys.push(k)
    }
  }

  if (needKeys.length) {
    const values = needKeys.map((k) => flatEn[k])
    const translated = await translateBatch(values, code, cache)
    needKeys.forEach((k, i) => {
      flat[k] = translated[i]
    })
  }

  for (const k of keys) {
    if (flat[k] == null || flat[k] === '') flat[k] = flatEn[k]
  }

  return unflatten(flat)
}

function markDone(code) {
  // file-lock style merge of progress across shards
  const progress = loadJson(progressPath, { done: [] })
  if (!progress.done.includes(code)) {
    progress.done.push(code)
    fs.writeFileSync(progressPath, JSON.stringify(progress))
  }
}

async function main() {
  const flatEn = flatten(en)
  console.log(`[shard ${SHARD}/${SHARDS}] keys=${Object.keys(flatEn).length}`)
  let cache = loadJson(cachePath, {})

  const priority = [
    'tn', 'es', 'fr', 'de', 'pt', 'pt-BR', 'ar', 'zh', 'zh-TW', 'sw', 'zu', 'af', 'st', 'nso', 'xh',
    'hi', 'ja', 'ko', 'ru', 'it', 'nl', 'tr', 'vi', 'id',
  ]
  const rest = LANGUAGES.map((l) => l.code).filter((c) => c !== 'en' && !priority.includes(c))
  const allCodes = [...priority, ...rest]
  const codes = allCodes.filter((_, i) => i % SHARDS === SHARD)

  for (const code of codes) {
    const outPath = path.join(localesDir, `${code}.json`)
    let existingFlat = {}
    if (fs.existsSync(outPath)) {
      existingFlat = flatten(JSON.parse(fs.readFileSync(outPath, 'utf8')))
      const missing = Object.keys(flatEn).filter((k) => !existingFlat[k])
      if (!missing.length) {
        console.log(`skip ${code}`)
        markDone(code)
        continue
      }
      console.log(`→ ${code} (+${missing.length} keys)`)
    } else {
      console.log(`→ ${code}`)
    }

    // reload cache so shards share hits
    cache = { ...loadJson(cachePath, {}), ...cache }
    const locale = await buildLocale(code, flatEn, cache, existingFlat)
    fs.writeFileSync(outPath, JSON.stringify(locale))
    markDone(code)
    fs.writeFileSync(cachePath, JSON.stringify(cache))
    console.log(`✓ ${code}`)
  }
  console.log(`ALL DONE shard ${SHARD}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
