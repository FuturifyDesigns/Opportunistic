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

function buildResources() {
  const resources = {
    en: { translation: en },
  }

  for (const { code } of LANGUAGES) {
    if (code === 'en') continue
    const fromShell = prune(shellToNested(SHELL[code]))
    const fromOverlay = overlays[code] || {}
    // Full English base so every key resolves; overlays/shell replace what we translate.
    resources[code] = {
      translation: deepMerge(deepMerge(deepMerge({}, en), fromShell), fromOverlay),
    }
  }

  return resources
}

const initial =
  getStoredLanguage() || detectBrowserLanguage() || 'en'

i18n.use(initReactI18next).init({
  resources: buildResources(),
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

applyDocumentLanguage(initial)

i18n.on('languageChanged', (lng) => {
  storeLanguage(lng)
  applyDocumentLanguage(lng)
})

export { LANGUAGES, storeLanguage }
export default i18n
