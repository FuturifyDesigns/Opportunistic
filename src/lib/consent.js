const STORAGE_KEY = 'opp_consent_v1'
const COOKIE_NAME = 'opp_consent'
const MAX_AGE = 365 * 24 * 60 * 60 // 1 year

export const CONSENT_VERSION = 1

export const DEFAULT_CONSENT = {
  version: CONSENT_VERSION,
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
  updatedAt: null,
}

function readCookie(name) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name, value, maxAge = MAX_AGE) {
  if (typeof document === 'undefined') return
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

export function getConsent() {
  try {
    const raw = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || readCookie(COOKIE_NAME)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== CONSENT_VERSION) return null
    return {
      ...DEFAULT_CONSENT,
      ...parsed,
      necessary: true,
    }
  } catch {
    return null
  }
}

export function hasConsentDecision() {
  return Boolean(getConsent()?.updatedAt)
}

export function saveConsent( partial ) {
  const next = {
    ...DEFAULT_CONSENT,
    ...getConsent(),
    ...partial,
    necessary: true,
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  }
  const payload = JSON.stringify(next)
  try {
    localStorage.setItem(STORAGE_KEY, payload)
  } catch {
    /* ignore quota */
  }
  writeCookie(COOKIE_NAME, payload)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('opp:consent', { detail: next }))
  }
  applyConsent(next)
  return next
}

export function acceptAll() {
  return saveConsent({
    preferences: true,
    analytics: true,
    marketing: true,
  })
}

export function rejectOptional() {
  return saveConsent({
    preferences: false,
    analytics: false,
    marketing: false,
  })
}

/** Load or unload optional scripts based on consent. */
export function applyConsent(consent = getConsent()) {
  if (!consent || typeof document === 'undefined') return

  // Analytics / marketing placeholders — only inject when allowed
  toggleScript('opp-analytics', consent.analytics, () => {
    // Reserved for GA4 / Plausible / etc. when you add a measurement ID.
    window.__OPP_ANALYTICS__ = true
  })

  toggleScript('opp-marketing', consent.marketing, () => {
    // Reserved for ad pixels — never load without marketing consent.
    window.__OPP_MARKETING__ = true
  })

  if (!consent.analytics) {
    delete window.__OPP_ANALYTICS__
    removeScript('opp-analytics')
  }
  if (!consent.marketing) {
    delete window.__OPP_MARKETING__
    removeScript('opp-marketing')
  }
}

function toggleScript(id, enabled, onEnable) {
  if (!enabled) {
    removeScript(id)
    return
  }
  if (document.getElementById(id)) return
  onEnable?.()
  const marker = document.createElement('script')
  marker.id = id
  marker.type = 'application/json'
  marker.textContent = JSON.stringify({ enabled: true, at: Date.now() })
  document.head.appendChild(marker)
}

function removeScript(id) {
  document.getElementById(id)?.remove()
}

export function openCookiePreferences() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('opp:open-cookies'))
}
