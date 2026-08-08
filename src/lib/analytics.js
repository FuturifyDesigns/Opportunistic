import { supabase } from './supabase'

export const ADMIN_EMAIL = 'futurifydesigns@gmail.com'

const SESSION_KEY = 'opp_analytics_sid'

export function isAdminEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase() === ADMIN_EMAIL
}

export function getAnalyticsSessionId() {
  if (typeof window === 'undefined') return 'server'
  try {
    let id = window.localStorage.getItem(SESSION_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      window.localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return `s_${Date.now()}`
  }
}

/**
 * Fire-and-forget analytics write. Never throws to callers.
 */
export async function trackEvent(eventType, { path, meta, userId } = {}) {
  try {
    const payload = {
      event_type: String(eventType || 'engage').slice(0, 64),
      session_id: getAnalyticsSessionId(),
      path: path ?? (typeof window !== 'undefined' ? window.location.pathname : null),
      meta: meta && typeof meta === 'object' ? meta : {},
      user_id: userId || null,
    }
    const { error } = await supabase.from('analytics_events').insert([payload])
    if (error) {
      // Table may not exist yet before migration — stay quiet in production UX.
      if (import.meta.env.DEV) console.warn('[analytics]', error.message)
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[analytics]', err)
  }
}

export function trackPageView(pathname, userId) {
  return trackEvent('page_view', {
    path: pathname,
    userId,
    meta: {
      href: typeof window !== 'undefined' ? window.location.href : null,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
    },
  })
}

export function trackEngage(action, extra = {}, userId) {
  return trackEvent('engage', {
    userId,
    meta: { action, ...extra },
  })
}

export async function fetchAdminOverview() {
  const { data, error } = await supabase.rpc('admin_overview')
  if (error) throw error
  return data
}
