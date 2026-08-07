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

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      refreshProfile(data.session?.user?.id, data.session?.user).finally(() => {
        if (mounted) setLoading(false)
      })
    })

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
