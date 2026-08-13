import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { trackEngage } from '../lib/analytics'

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

/** Email confirm links create a session — we verify then sign out so the user signs in manually. */
function isEmailConfirmCallback() {
  if (typeof window === 'undefined') return false
  const url = new URL(window.location.href)
  const path = url.pathname.replace(/\/+$/, '') || '/'
  if (path === '/verified') return true
  const hash = url.hash?.replace(/^#/, '') || ''
  const hp = new URLSearchParams(hash)
  const type = url.searchParams.get('type') || hp.get('type')
  return type === 'signup' || type === 'email' || type === 'email_change'
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileReady, setProfileReady] = useState(false)

  async function refreshProfile(userId, user, { markBusy = true } = {}) {
    if (!userId) {
      setProfile(null)
      setProfileReady(true)
      return null
    }
    if (markBusy) setProfileReady(false)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      console.error(error)
      setProfileReady(true)
      return null
    }

    let next = data
    const displayName = oauthDisplayName(user)

    // Google (and other OAuth) may create auth.users before the profile trigger lands.
    // Never upsert missing columns — that can reset onboarding_complete on sign-in.
    if (!next) {
      const { error: createErr } = await supabase.from('profiles').upsert(
        {
          user_id: userId,
          full_name: displayName || '',
        },
        { onConflict: 'user_id', ignoreDuplicates: true, defaultToNull: false },
      )
      if (createErr) console.error(createErr)
      const { data: again, error: againErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (againErr) console.error(againErr)
      next = again
    } else if (displayName && !String(next.full_name || '').trim()) {
      const { data: updated } = await supabase
        .from('profiles')
        .update({ full_name: displayName })
        .eq('user_id', userId)
        .select('*')
        .maybeSingle()
      if (updated) next = updated
      else next = { ...next, full_name: displayName }
    }

    if (next && !next.onboarding_complete && String(next.country || '').trim()) {
      const [{ count: qCount }, { count: sCount }] = await Promise.all([
        supabase.from('qualifications').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('skills').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ])
      if ((qCount || 0) > 0 && (sCount || 0) > 0) {
        const { error: healErr } = await supabase
          .from('profiles')
          .update({ onboarding_complete: true })
          .eq('user_id', userId)
        if (!healErr) next = { ...next, onboarding_complete: true }
      }
    }

    setProfile(next)
    setProfileReady(true)
    return next
  }

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      try {
        const emailConfirm = hasAuthCallbackParams() && isEmailConfirmCallback()
        if (emailConfirm) {
          try {
            sessionStorage.setItem('opp_email_confirm', '1')
          } catch {
            /* ignore */
          }
        }

        if (hasAuthCallbackParams()) {
          const url = new URL(window.location.href)
          const code = url.searchParams.get('code')
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (error) console.error('OAuth code exchange failed:', error.message)
          }
          cleanAuthParamsFromUrl()
        }

        if (emailConfirm) {
          // Consume the confirm token, then drop the session so they must sign in.
          await supabase.auth.signOut()
          if (!mounted) return
          setSession(null)
          setProfile(null)
          setProfileReady(true)
          return
        }

        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(data.session ?? null)
        await refreshProfile(data.session?.user?.id, data.session?.user)
      } catch (err) {
        console.error(err)
        if (mounted) {
          setProfile(null)
          setProfileReady(true)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (!next?.user) {
        setProfile(null)
        setProfileReady(true)
        return
      }
      const markBusy = event === 'SIGNED_IN' || event === 'INITIAL_SESSION'
      if (markBusy) setProfileReady(false)
      // Defer so the JWT is attached before profile RLS queries.
      window.setTimeout(() => {
        void refreshProfile(next.user.id, next.user, { markBusy })
      }, 0)
      if (event === 'SIGNED_IN' && next?.user?.id) {
        let skipTrack = false
        try {
          skipTrack = sessionStorage.getItem('opp_email_confirm') === '1'
        } catch {
          /* ignore */
        }
        if (!skipTrack) {
          trackEngage('sign_in', { provider: next.user.app_metadata?.provider }, next.user.id)
        }
      }
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
      profileReady,
      refreshProfile: () => refreshProfile(session?.user?.id, session?.user, { markBusy: false }),
      signOut: () => supabase.auth.signOut(),
    }),
    [session, profile, loading, profileReady],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
