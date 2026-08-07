import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

function oauthDisplayName(user) {
  const meta = user?.user_metadata || {}
  return (
    meta.full_name?.trim() ||
    meta.name?.trim() ||
    meta.preferred_username?.trim() ||
    user?.email?.split('@')[0] ||
    ''
  )
}

function hasAuthCallbackParams() {
  if (typeof window === 'undefined') return false
  const url = new URL(window.location.href)
  if (url.searchParams.get('code')) return true
  if (url.searchParams.get('error') || url.searchParams.get('error_description')) return true
  const hash = url.hash?.replace(/^#/, '')
  if (!hash) return false
  const hp = new URLSearchParams(hash)
  return Boolean(hp.get('access_token') || hp.get('error') || hp.get('error_description'))
}

function cleanAuthParamsFromUrl() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  const before = url.href
  ;['code', 'state', 'error', 'error_description', 'error_code'].forEach((k) => url.searchParams.delete(k))
  if (url.hash && /access_token|error|refresh_token|provider_token/.test(url.hash)) {
    url.hash = ''
  }
  const next = `${url.pathname}${url.search}${url.hash}`
  if (before !== `${url.origin}${next}`) {
    window.history.replaceState({}, '', next)
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refreshProfile(userId, user) {
    if (!userId) {
      setProfile(null)
      return null
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      console.error(error)
      return null
    }

    let next = data
    const displayName = oauthDisplayName(user)
    if (next && displayName && !String(next.full_name || '').trim()) {
      const { data: updated } = await supabase
        .from('profiles')
        .update({ full_name: displayName })
        .eq('user_id', userId)
        .select('*')
        .maybeSingle()
      if (updated) next = updated
      else next = { ...next, full_name: displayName }
    }

    setProfile(next)
    return next
  }

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        if (hasAuthCallbackParams()) {
          const url = new URL(window.location.href)
          const code = url.searchParams.get('code')
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (error) console.error('OAuth code exchange failed:', error.message)
          }
          cleanAuthParamsFromUrl()
        }

        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(data.session ?? null)
        await refreshProfile(data.session?.user?.id, data.session?.user)
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      refreshProfile(next?.user?.id, next?.user)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      refreshProfile: () => refreshProfile(session?.user?.id, session?.user),
      signOut: () => supabase.auth.signOut(),
    }),
    [session, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
