import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export default function Auth() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile, loading } = useAuth()
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const title = useMemo(() => (mode === 'signup' ? 'Create your account' : 'Welcome back'), [mode])

  useEffect(() => {
    document.title = `${title} — Opportunistic`
  }, [title])

  useEffect(() => {
    if (loading || !user) return
    if (profile && !profile.onboarding_complete) navigate('/onboarding', { replace: true })
    else navigate('/dashboard', { replace: true })
  }, [user, profile, loading, navigate])

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
        if (!data.session) {
          setMessage('Check your email to confirm your account, then sign in.')
          setMode('login')
        } else {
          navigate('/onboarding')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/dashboard')
      }
    } catch (err) {
      setMessage(err.message || 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <SiteHeader />
      <main className="container narrow auth-panel">
        <p className="eyebrow">Account</p>
        <h1>{title}</h1>
        <p className="muted">Worldwide matching starts with a secure account.</p>

        <div className="segmented">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Sign in
          </button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            Sign up
          </button>
        </div>

        <form className="stack-form" onSubmit={onSubmit}>
          {mode === 'signup' ? (
            <label>
              Full name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
            </label>
          ) : null}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </label>
          {message ? <p className="form-message">{message}</p> : null}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="legal-inline">
          By continuing you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
