import { useEffect, useMemo, useRef, useState } from 'react'
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

const SIDES = {
  login: {
    label: 'Sign in',
    code: 'RETURN',
    title: 'Continue your path',
    points: ['Open saved matches', 'Update profile data', 'Resume where you left off'],
  },
  signup: {
    label: 'Sign up',
    code: 'BEGIN',
    title: 'Open a new lane',
    points: ['Build a living profile', 'Run first match cycle', 'Scholarships + jobs, ranked'],
  },
}

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
  const root = useRef(null)
  const formRef = useRef(null)

  const paramMode = params.get('mode') === 'signup' ? 'signup' : 'login'
  const [phase, setPhase] = useState('choose')
  const [hover, setHover] = useState(null)
  const [mode, setMode] = useState(paramMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const title = mode === 'signup' ? 'Create account' : 'Sign in'
  const errors = useMemo(
    () => validate(mode, { fullName, email, password, confirm }),
    [mode, fullName, email, password, confirm],
  )
  const hasErrors = Object.keys(errors).length > 0
  const activeSide = hover || (phase === 'form' ? mode : null)

  useEffect(() => {
    document.title = `${title} — Opportunistic`
  }, [title])

  useEffect(() => {
    if (loading || !user) return
    if (profile && !profile.onboarding_complete) navigate('/onboarding', { replace: true })
    else navigate('/dashboard', { replace: true })
  }, [user, profile, loading, navigate])

  useGSAP(
    () => {
      if (prefersReducedMotion() || phase !== 'choose') return
      gsap.from('.auth-orb', {
        scale: 0.7,
        opacity: 0,
        y: 30,
        stagger: 0.12,
        duration: 0.65,
        ease: 'power3.out',
      })
      gsap.to('.auth-orb-core', {
        y: -8,
        duration: 2.2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        stagger: 0.35,
      })
      gsap.to('.auth-orb-ring', {
        rotate: 360,
        duration: 18,
        repeat: -1,
        ease: 'none',
        stagger: 0.2,
      })
    },
    { scope: root, dependencies: [phase] },
  )

  useGSAP(
    () => {
      if (phase !== 'form' || prefersReducedMotion()) return
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 28, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out' },
      )
      gsap.from('.auth-field', {
        opacity: 0,
        x: mode === 'signup' ? 24 : -24,
        stagger: 0.07,
        duration: 0.4,
        delay: 0.15,
        ease: 'power2.out',
      })
    },
    { scope: root, dependencies: [phase, mode] },
  )

  function openSide(next) {
    setMode(next)
    setTouched({})
    setMessage('')
    setHover(next)

    if (prefersReducedMotion()) {
      setPhase('form')
      return
    }

    const tl = gsap.timeline({
      onComplete: () => setPhase('form'),
    })
    tl.to('.auth-choose-copy', { opacity: 0, y: -12, duration: 0.25 })
      .to(
        next === 'login' ? '.orb-signup' : '.orb-login',
        { scale: 0.4, opacity: 0, x: next === 'login' ? 80 : -80, duration: 0.4, ease: 'power2.in' },
        0,
      )
      .to(
        next === 'login' ? '.orb-login' : '.orb-signup',
        { scale: 1.15, duration: 0.35, ease: 'power2.out' },
        0,
      )
      .to('.auth-orbs', { opacity: 0, duration: 0.25 }, 0.25)
  }

  function backToChoose() {
    setPhase('choose')
    setHover(null)
    setTouched({})
    setMessage('')
  }

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
    <PageBackdrop image="auth.jpg" className={`auth-page side-${activeSide || 'neutral'}`}>
      <div ref={root} className="auth-root">
        <SiteHeader />

        <main className="auth-gateway">
          {phase === 'choose' ? (
            <section className="auth-choose">
              <div className="auth-choose-copy">
                <p className="eyebrow">Access</p>
                <h1>Choose a portal.</h1>
                <p className="lede">Hover a sphere. Click to open the form.</p>
              </div>

              <div className="auth-orbs" role="group" aria-label="Sign in or sign up">
                {(['login', 'signup']).map((side) => {
                  const meta = SIDES[side]
                  const isHot = hover === side
                  return (
                    <button
                      key={side}
                      type="button"
                      className={`auth-orb orb-${side} ${isHot ? 'hot' : ''} ${hover && !isHot ? 'dim' : ''}`}
                      onMouseEnter={() => setHover(side)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(side)}
                      onBlur={() => setHover(null)}
                      onClick={() => openSide(side)}
                      aria-label={meta.label}
                    >
                      <span className="auth-orb-ring" aria-hidden="true" />
                      <span className="auth-orb-core">
                        <img src={`${import.meta.env.BASE_URL}mark.svg`} alt="" />
                        <strong>{meta.code}</strong>
                        <em>{meta.label}</em>
                      </span>
                      <span className={`auth-orb-info ${isHot ? 'show' : ''}`}>
                        <strong>{meta.title}</strong>
                        <ul>
                          {meta.points.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                        <span className="orb-cta">Click to continue</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ) : (
            <section className="auth-form-stage" ref={formRef}>
              <button type="button" className="auth-back" onClick={backToChoose}>
                ← Portals
              </button>
              <div className="auth-card">
                <p className="eyebrow">{SIDES[mode].code}</p>
                <h1>{title}</h1>
                <p className="muted">{SIDES[mode].title}</p>

                <form className="stack-form" onSubmit={onSubmit} noValidate>
                  {mode === 'signup' ? (
                    <label className={`auth-field ${touched.fullName && errors.fullName ? 'invalid' : ''}`}>
                      Full name
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onBlur={() => markTouched('fullName')}
                        autoComplete="name"
                        aria-invalid={Boolean(touched.fullName && errors.fullName)}
                      />
                      {touched.fullName && errors.fullName ? (
                        <span className="field-error">{errors.fullName}</span>
                      ) : null}
                    </label>
                  ) : null}

                  <label className={`auth-field ${touched.email && errors.email ? 'invalid' : ''}`}>
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

                  <label className={`auth-field ${touched.password && errors.password ? 'invalid' : ''}`}>
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
                    {touched.password && errors.password ? (
                      <span className="field-error">{errors.password}</span>
                    ) : null}
                    {mode === 'signup' ? (
                      <span className="field-hint">At least 8 characters, with a letter and a number.</span>
                    ) : null}
                  </label>

                  {mode === 'signup' ? (
                    <label className={`auth-field ${touched.confirm && errors.confirm ? 'invalid' : ''}`}>
                      Confirm password
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        onBlur={() => markTouched('confirm')}
                        autoComplete="new-password"
                        aria-invalid={Boolean(touched.confirm && errors.confirm)}
                      />
                      {touched.confirm && errors.confirm ? (
                        <span className="field-error">{errors.confirm}</span>
                      ) : null}
                    </label>
                  ) : null}

                  {message ? (
                    <p className={`form-message ${hasErrors && message.includes('fix') ? 'warn' : ''}`}>{message}</p>
                  ) : null}

                  <button className="btn auth-field" type="submit" disabled={busy}>
                    {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
                  </button>
                </form>

                <p className="legal-inline">
                  By continuing you agree to our <Link to="/terms">Terms</Link> and{' '}
                  <Link to="/privacy">Privacy Policy</Link>.
                </p>
              </div>
            </section>
          )}
        </main>

        <SiteFooter />
      </div>
    </PageBackdrop>
  )
}
