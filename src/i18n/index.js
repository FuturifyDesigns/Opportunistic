import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import overlays from './overlays.json'
import { SHELL, shellToNested } from './shell'
import {
  LANGUAGES,
  detectBrowserLanguage,
  getStoredLanguage,
  languageMeta,
  storeLanguage,
} from './languages'

const localeModules = import.meta.glob('./locales/*.json')

function prune(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const out = Array.isArray(obj) ? [] : {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue
    if (typeof v === 'object' && !Array.isArray(v)) {
      const nested = prune(v)
      if (Object.keys(nested).length) out[k] = nested
    } else {
      out[k] = v
    }
  }
  return out
}

function deepMerge(a, b) {
  const out = { ...a }
  for (const [k, v] of Object.entries(b || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(a[k] || {}, v)
    } else if (v !== undefined) {
      out[k] = v
    }
  }
  return out
}

function composeLocale(code, generated) {
  const fromShell = prune(shellToNested(SHELL[code]))
  const fromOverlay = overlays[code] || {}
  return deepMerge(deepMerge(deepMerge(deepMerge({}, en), fromShell), fromOverlay), generated || {})
}

const loaded = new Set(['en'])

async function loadLocale(code) {
  if (!code || code === 'en' || loaded.has(code)) return
  const key = Object.keys(localeModules).find((p) => p.endsWith(`/locales/${code}.json`))
  let generated = null
  if (key) {
    try {
      const mod = await localeModules[key]()
      generated = mod?.default || mod
    } catch {
      generated = null
    }
  }
  i18n.addResourceBundle(code, 'translation', composeLocale(code, generated), true, true)
  loaded.add(code)
}

const initial = getStoredLanguage() || detectBrowserLanguage() || 'en'

// Seed lightweight packs so language switcher labels / shell work before full load.
const bootstrap = { en: { translation: en } }
for (const { code } of LANGUAGES) {
  if (code === 'en') continue
  const fromShell = prune(shellToNested(SHELL[code]))
  const fromOverlay = overlays[code] || {}
  bootstrap[code] = {
    translation: deepMerge(deepMerge(deepMerge({}, en), fromShell), fromOverlay),
  }
}

i18n.use(initReactI18next).init({
  resources: bootstrap,
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
  react: {
    useSuspense: false,
    bindI18n: 'languageChanged loaded',
    bindI18nStore: 'added removed',
  },
})

export function applyDocumentLanguage(code = i18n.language) {
  const meta = languageMeta(code)
  document.documentElement.lang = code
  document.documentElement.dir = meta.dir === 'rtl' ? 'rtl' : 'ltr'
}

export async function changeAppLanguage(code) {
  await loadLocale(code)
  await i18n.changeLanguage(code)
  applyDocumentLanguage(code)
}

// Prefetch initial language pack
loadLocale(initial).then(() => {
  if (i18n.language === initial) {
    i18n.reloadResources(initial)
    applyDocumentLanguage(initial)
  }
})

applyDocumentLanguage(initial)

i18n.on('languageChanged', (lng) => {
  storeLanguage(lng)
  applyDocumentLanguage(lng)
  loadLocale(lng)
})

export { LANGUAGES, storeLanguage, loadLocale }
export default i18n
