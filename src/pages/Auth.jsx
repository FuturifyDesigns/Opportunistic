import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import PageBackdrop from '../components/PageBackdrop'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

function validate(mode, { fullName, email, password, confirm }) {
  const errors = {}
  if (mode === 'signup') {
    if (!fullName.trim()) errors.fullName = 'Enter your full name.'
    else if (fullName.trim().length < 2) errors.fullName = 'Name must be at least 2 characters.'
  }
  if (!email.trim()) errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Password is required.'
  else if (password.length < 8) errors.password = 'Use at least 8 characters.'
  else if (mode === 'signup' && !/[A-Za-z]/.test(password)) errors.password = 'Include at least one letter.'
  else if (mode === 'signup' && !/[0-9]/.test(password)) errors.password = 'Include at least one number.'
  if (mode === 'signup') {
    if (!confirm) errors.confirm = 'Confirm your password.'
    else if (confirm !== password) errors.confirm = 'Passwords do not match.'
  }
  return errors
}

export default function Auth() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile, loading } = useAuth()
  const initialMode = params.get('mode') === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const title = useMemo(() => (mode === 'signup' ? 'Create your account' : 'Welcome back'), [mode])
  const errors = useMemo(
    () => validate(mode, { fullName, email, password, confirm }),
    [mode, fullName, email, password, confirm],
  )
  const hasErrors = Object.keys(errors).length > 0

  useEffect(() => {
    document.title = `${title} — Opportunistic`
  }, [title])

  useEffect(() => {
    setMode(params.get('mode') === 'signup' ? 'signup' : 'login')
    setTouched({})
    setMessage('')
  }, [params])

  useEffect(() => {
    if (loading || !user) return
    if (profile && !profile.onboarding_complete) navigate('/onboarding', { replace: true })
    else navigate('/dashboard', { replace: true })
  }, [user, profile, loading, navigate])

  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from('.auth-card', { y: 28, opacity: 0, duration: 0.55, ease: 'power3.out' })
  }, [])

  function markTouched(field) {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setTouched({ fullName: true, email: true, password: true, confirm: true })
    if (hasErrors) {
      setMessage('Please fix the highlighted fields.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        })
        if (error) throw error
        if (!data.session) {
          setMessage('Check your email to confirm your account, then sign in.')
          setMode('login')
        } else {
          navigate('/onboarding')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
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
    <PageBackdrop image="auth.jpg" className="auth-page">
      <SiteHeader />
      <main className="container narrow auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Account</p>
          <h1>{title}</h1>
          <p className="muted">Worldwide matching starts with a secure account.</p>

          <div className="segmented auth-segmented">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login')
                setTouched({})
                setMessage('')
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => {
                setMode('signup')
                setTouched({})
                setMessage('')
              }}
            >
              Sign up
            </button>
          </div>

          <form className="stack-form" onSubmit={onSubmit} noValidate>
            {mode === 'signup' ? (
              <label className={touched.fullName && errors.fullName ? 'invalid' : ''}>
                Full name
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => markTouched('fullName')}
                  autoComplete="name"
                  aria-invalid={Boolean(touched.fullName && errors.fullName)}
                />
                {touched.fullName && errors.fullName ? <span className="field-error">{errors.fullName}</span> : null}
              </label>
            ) : null}

            <label className={touched.email && errors.email ? 'invalid' : ''}>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched('email')}
                autoComplete="email"
                aria-invalid={Boolean(touched.email && errors.email)}
              />
              {touched.email && errors.email ? <span className="field-error">{errors.email}</span> : null}
            </label>

            <label className={touched.password && errors.password ? 'invalid' : ''}>
              Password
              <div className="password-field">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched('password')}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  aria-invalid={Boolean(touched.password && errors.password)}
                />
                <button type="button" className="ghost-toggle" onClick={() => setShowPass((v) => !v)}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {touched.password && errors.password ? <span className="field-error">{errors.password}</span> : null}
              {mode === 'signup' ? (
                <span className="field-hint">At least 8 characters, with a letter and a number.</span>
              ) : null}
            </label>

            {mode === 'signup' ? (
              <label className={touched.confirm && errors.confirm ? 'invalid' : ''}>
                Confirm password
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => markTouched('confirm')}
                  autoComplete="new-password"
                  aria-invalid={Boolean(touched.confirm && errors.confirm)}
                />
                {touched.confirm && errors.confirm ? <span className="field-error">{errors.confirm}</span> : null}
              </label>
            ) : null}

            {message ? <p className={`form-message ${hasErrors && message.includes('fix') ? 'warn' : ''}`}>{message}</p> : null}

            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="legal-inline">
            By continuing you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
            {mode === 'login' ? (
              <>
                {' '}
                New here? <Link to="/auth?mode=signup">Get started</Link>.
              </>
            ) : (
              <>
                {' '}
                Already have an account? <Link to="/auth">Sign in</Link>.
              </>
            )}
          </p>
        </div>
      </main>
      <SiteFooter />
    </PageBackdrop>
  )
}
