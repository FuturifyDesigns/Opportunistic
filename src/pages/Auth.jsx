import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import PageBackdrop from '../components/PageBackdrop'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

const PASSWORD_MIN = 8

function passwordChecks(password) {
  return {
    length: password.length >= PASSWORD_MIN,
    letter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
    upper: /[A-Z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    long: password.length >= 12,
  }
}

function passwordStrength(password) {
  if (!password) return { score: 0, level: 'empty', percent: 0, checks: passwordChecks('') }
  const checks = passwordChecks(password)
  let score = 0
  if (checks.length) score += 1
  if (checks.letter) score += 1
  if (checks.number) score += 1
  if (checks.upper) score += 1
  if (checks.special || checks.long) score += 1
  const levels = ['weak', 'weak', 'fair', 'good', 'strong', 'strong']
  const level = levels[score] || 'weak'
  const percent = Math.min(100, Math.round((score / 5) * 100))
  return { score, level, percent, checks }
}

function validate(mode, { fullName, email, password, confirm }, t) {
  const errors = {}
  if (mode === 'signup') {
    if (!fullName.trim()) errors.fullName = t('auth.errNameRequired')
    else if (fullName.trim().length < 2) errors.fullName = t('auth.errNameShort')
  }
  if (!email.trim()) errors.email = t('auth.errEmailRequired')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = t('auth.errEmailInvalid')
  if (!password) errors.password = t('auth.errPasswordRequired')
  else if (password.length < PASSWORD_MIN) errors.password = t('auth.errPasswordShort')
  else if (mode === 'signup') {
    const checks = passwordChecks(password)
    if (!checks.letter) errors.password = t('auth.errPasswordLetter')
    else if (!checks.number) errors.password = t('auth.errPasswordNumber')
  }
  if (mode === 'signup') {
    if (!confirm) errors.confirm = t('auth.errConfirmRequired')
    else if (confirm !== password) errors.confirm = t('auth.errPasswordMismatch')
  }
  return errors
}

function RequiredMark() {
  return (
    <span className="field-required" aria-hidden="true">
      *
    </span>
  )
}

export default function Auth() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile, loading } = useAuth()
  const toast = useToast()
  const root = useRef(null)
  const formRef = useRef(null)
  const floatTweens = useRef({})

  const SIDES = {
    login: {
      label: t('auth.signIn'),
      code: 'RETURN',
      title: t('auth.continuePath'),
      points: [t('auth.loginPoint1'), t('auth.loginPoint2'), t('auth.loginPoint3')],
    },
    signup: {
      label: t('auth.signUp'),
      code: 'BEGIN',
      title: t('auth.openLane'),
      points: [t('auth.signupPoint1'), t('auth.signupPoint2'), t('auth.signupPoint3')],
    },
  }

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
  const [oauthBusy, setOauthBusy] = useState(false)

  const title = mode === 'signup' ? t('auth.createAccount') : t('auth.signIn')
  const errors = useMemo(
    () => validate(mode, { fullName, email, password, confirm }, t),
    [mode, fullName, email, password, confirm, t],
  )
  const strength = useMemo(() => passwordStrength(password), [password])
  const showPasswordGuide = mode === 'signup' && password.length > 0
  const activeSide = hover || (phase === 'form' ? mode : null)

  useEffect(() => {
    document.title = `${title} — Opportunistic`
  }, [title])

  useEffect(() => {
    const err =
      params.get('error_description') ||
      params.get('error') ||
      (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.hash.replace(/^#/, '')).get('error_description')
        : null)
    if (err) {
      const msg = decodeURIComponent(err.replace(/\+/g, ' '))
      setMessage(msg)
      toast.error(msg)
    }
  }, [params, toast])

  useEffect(() => {
    function clearOauthBusy() {
      setOauthBusy(false)
    }
    function onPageShow(e) {
      if (e.persisted) clearOauthBusy()
    }
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('focus', clearOauthBusy)
    return () => {
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('focus', clearOauthBusy)
    }
  }, [])

  useEffect(() => {
    if (loading || !user) return
    if (profile && !profile.onboarding_complete) navigate('/onboarding', { replace: true })
    else navigate('/dashboard', { replace: true })
  }, [user, profile, loading, navigate])

  useGSAP(
    () => {
      if (prefersReducedMotion() || phase !== 'choose') return
      gsap.fromTo(
        '.auth-orb',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power2.out', clearProps: 'transform' },
      )
    },
    { scope: root, dependencies: [phase] },
  )

  useGSAP(
    () => {
      if (phase !== 'form') return
      const panel = formRef.current
      if (!panel) return
      if (prefersReducedMotion()) {
        gsap.set(panel, { clearProps: 'all' })
        return
      }
      gsap.fromTo(panel, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' })
      gsap.fromTo(
        panel.querySelectorAll('.auth-field'),
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, stagger: 0.06, duration: 0.35, delay: 0.1, ease: 'power2.out' },
      )
    },
    { scope: root, dependencies: [phase, mode] },
  )

  function startFloat(side, el) {
    if (prefersReducedMotion() || !el) return
    stopFloat(side)
    const core = el.querySelector('.auth-orb-core')
    const ring = el.querySelector('.auth-orb-ring')
    if (!core) return
    floatTweens.current[side] = [
      gsap.to(core, { y: -10, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut' }),
      ring ? gsap.to(ring, { rotate: '+=360', duration: 10, repeat: -1, ease: 'none' }) : null,
    ].filter(Boolean)
  }

  function stopFloat(side) {
    const list = floatTweens.current[side] || []
    list.forEach((tw) => tw.kill())
    floatTweens.current[side] = []
    const el = root.current?.querySelector(`.orb-${side}`)
    if (!el) return
    const core = el.querySelector('.auth-orb-core')
    const ring = el.querySelector('.auth-orb-ring')
    if (core) gsap.set(core, { y: 0 })
    if (ring) gsap.set(ring, { rotate: 0 })
  }

  function onOrbEnter(side, el) {
    setHover(side)
    startFloat(side, el)
  }

  function onOrbLeave(side) {
    setHover(null)
    stopFloat(side)
  }

  function openSide(next) {
    stopFloat('login')
    stopFloat('signup')
    setMode(next)
    setHover(next)
    setTouched({})
    setMessage('')
    if (prefersReducedMotion()) {
      setPhase('form')
      return
    }
    const choose = root.current?.querySelector('.auth-choose')
    if (!choose) {
      setPhase('form')
      return
    }
    gsap.to(choose, {
      opacity: 0,
      y: -12,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => {
        setPhase('form')
        gsap.set(choose, { clearProps: 'all' })
      },
    })
  }

  function backToChoose() {
    setPhase('choose')
    setHover(null)
    setTouched({})
    setMessage('')
    stopFloat('login')
    stopFloat('signup')
  }

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setTouched({ fullName: true, email: true, password: true, confirm: true })
    const nextErrors = validate(mode, { fullName, email, password, confirm }, t)
    if (Object.keys(nextErrors).length) {
      const msg = t('auth.errFixFields')
      setMessage(msg)
      toast.error(msg)
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
          const msg = t('auth.checkEmail')
          setMessage(msg)
          toast.info(msg)
          setMode('login')
        } else {
          toast.success(t('common.toast.accountCreated'))
          navigate('/onboarding')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        toast.success(t('common.toast.signedIn'))
        navigate('/dashboard')
      }
    } catch (err) {
      const msg = err.message || t('auth.genericError')
      setMessage(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  async function continueWithGoogle() {
    if (oauthBusy || busy) return
    setOauthBusy(true)
    setMessage('')
    try {
      const redirectTo = `${window.location.origin}/auth`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })
      if (error) throw error
    } catch (err) {
      const msg = err.message || t('auth.googleError')
      setMessage(msg)
      toast.error(msg)
      setOauthBusy(false)
    }
  }

  function GoogleButton({ className = '' }) {
    return (
      <button
        type="button"
        className={`btn-google ${className}`.trim()}
        onClick={continueWithGoogle}
        disabled={oauthBusy || busy}
      >
        <svg className="btn-google-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.15 3.58-8.64Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.86-3a7.2 7.2 0 0 1-10.78-3.78H1.32v3.09A12 12 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.31 14.32A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.59.4-2.32V6.59H1.32A12 12 0 0 0 0 12c0 1.94.46 3.77 1.32 5.41l3.99-3.09Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.32 6.59l3.99 3.09A7.18 7.18 0 0 1 12 4.75Z"
          />
        </svg>
        <span>{oauthBusy ? t('auth.googleRedirecting') : t('auth.continueWithGoogle')}</span>
      </button>
    )
  }

  return (
    <PageBackdrop image="auth.jpg" className={`auth-page side-${activeSide || 'neutral'}`}>
      <div ref={root} className="auth-root">
        <SiteHeader />
        <main className="auth-gateway">
          {phase === 'choose' ? (
            <section className="auth-choose">
              <div className="auth-choose-copy">
                <p className="eyebrow">{t('auth.accessEyebrow')}</p>
                <h1>{t('auth.choosePortal')}</h1>
              </div>
              <div className="auth-orbs" role="group" aria-label={`${t('auth.signIn')} / ${t('auth.signUp')}`}>
                {(['login', 'signup']).map((side) => {
                  const meta = SIDES[side]
                  const isHot = hover === side
                  return (
                    <button
                      key={side}
                      type="button"
                      className={`auth-orb orb-${side} ${isHot ? 'hot' : ''} ${hover && !isHot ? 'dim' : ''}`}
                      onMouseEnter={(e) => onOrbEnter(side, e.currentTarget)}
                      onMouseLeave={() => onOrbLeave(side)}
                      onFocus={(e) => onOrbEnter(side, e.currentTarget)}
                      onBlur={() => onOrbLeave(side)}
                      onClick={() => openSide(side)}
                      aria-label={meta.label}
                    >
                      <span className="auth-orb-ring" aria-hidden="true" />
                      <span className="auth-orb-core">
                        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
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
                        <span className="orb-cta">{t('common.continue')}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ) : (
            <section className="auth-form-stage" ref={formRef}>
              <button type="button" className="auth-back" onClick={backToChoose}>
                ← {t('auth.backToChoose')}
              </button>
              <div className="auth-card">
                <p className="eyebrow">{SIDES[mode].code}</p>
                <h1>{title}</h1>
                <p className="muted">{SIDES[mode].title}</p>
                <GoogleButton className="auth-field" />
                <p className="auth-divider">
                  <span>{t('auth.orEmail')}</span>
                </p>
                <form className="stack-form" onSubmit={onSubmit} noValidate>
                  {mode === 'signup' ? (
                    <label className={`auth-field ${touched.fullName && errors.fullName ? 'invalid' : ''}`}>
                      <span>
                        {t('auth.fullName')}
                        <RequiredMark />
                      </span>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onBlur={() => markTouched('fullName')}
                        autoComplete="name"
                        required
                        aria-required="true"
                        aria-invalid={Boolean(touched.fullName && errors.fullName)}
                      />
                      {touched.fullName && errors.fullName ? <span className="field-error">{errors.fullName}</span> : null}
                    </label>
                  ) : null}
                  <label className={`auth-field ${touched.email && errors.email ? 'invalid' : ''}`}>
                    <span>
                      {t('auth.email')}
                      <RequiredMark />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => markTouched('email')}
                      autoComplete="email"
                      required
                      aria-required="true"
                      aria-invalid={Boolean(touched.email && errors.email)}
                    />
                    {touched.email && errors.email ? <span className="field-error">{errors.email}</span> : null}
                  </label>
                  <div className={`auth-field ${touched.password && errors.password ? 'invalid' : ''}`}>
                    <label htmlFor="auth-password">
                      <span>
                        {t('auth.password')}
                        <RequiredMark />
                      </span>
                    </label>
                    <div className="password-field">
                      <input
                        id="auth-password"
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (message) setMessage('')
                        }}
                        onBlur={() => markTouched('password')}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        required
                        aria-required="true"
                        aria-invalid={Boolean(touched.password && errors.password)}
                        aria-describedby={showPasswordGuide ? 'auth-password-guide' : undefined}
                        minLength={mode === 'signup' ? PASSWORD_MIN : undefined}
                      />
                      <button type="button" className="ghost-toggle" onClick={() => setShowPass((v) => !v)}>
                        {showPass ? t('auth.hidePassword') : t('auth.showPassword')}
                      </button>
                    </div>
                    {showPasswordGuide ? (
                      <div id="auth-password-guide" className="password-guide">
                        <div
                          className={`password-meter level-${strength.level}`}
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={strength.percent}
                          aria-label={t('auth.passwordStrengthLabel', { level: t(`auth.strength.${strength.level}`) })}
                        >
                          <div className="password-meter-track">
                            <div className="password-meter-fill" style={{ width: `${strength.percent}%` }} />
                          </div>
                          <span className="password-meter-label">{t(`auth.strength.${strength.level}`)}</span>
                        </div>
                        <p className="field-hint">{t('auth.passwordHint')}</p>
                        <ul className="password-reqs">
                          <li className={strength.checks.length ? 'met' : ''}>{t('auth.reqLength')}</li>
                          <li className={strength.checks.letter ? 'met' : ''}>{t('auth.reqLetter')}</li>
                          <li className={strength.checks.number ? 'met' : ''}>{t('auth.reqNumber')}</li>
                          <li className={strength.checks.upper ? 'met' : 'optional'}>{t('auth.reqUpper')}</li>
                          <li className={strength.checks.special || strength.checks.long ? 'met' : 'optional'}>
                            {t('auth.reqStronger')}
                          </li>
                        </ul>
                      </div>
                    ) : mode === 'signup' ? (
                      <p className="field-hint">{t('auth.passwordHintIdle')}</p>
                    ) : null}
                    {touched.password && errors.password ? <span className="field-error">{errors.password}</span> : null}
                  </div>
                  {mode === 'signup' ? (
                    <label className={`auth-field ${touched.confirm && errors.confirm ? 'invalid' : ''}`}>
                      <span>
                        {t('auth.confirmPassword')}
                        <RequiredMark />
                      </span>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => {
                          setConfirm(e.target.value)
                          if (message) setMessage('')
                        }}
                        onBlur={() => markTouched('confirm')}
                        autoComplete="new-password"
                        required
                        aria-required="true"
                        aria-invalid={Boolean(touched.confirm && errors.confirm)}
                      />
                      {confirm.length > 0 && !errors.confirm ? (
                        <span className="field-ok">{t('auth.passwordsMatch')}</span>
                      ) : null}
                      {touched.confirm && errors.confirm ? <span className="field-error">{errors.confirm}</span> : null}
                    </label>
                  ) : null}
                  {message ? (
                    <p className={`form-message ${Object.keys(errors).length && !busy ? 'warn' : ''}`}>{message}</p>
                  ) : null}
                  <button className="btn auth-field" type="submit" disabled={busy}>
                    {busy ? t('common.loading') : mode === 'signup' ? t('auth.submitSignUp') : t('auth.submitSignIn')}
                  </button>
                </form>
                <p className="legal-inline">
                  {t('auth.agreePrefix')} <Link to="/terms">{t('nav.terms')}</Link> {t('auth.and')}{' '}
                  <Link to="/privacy">{t('nav.privacy')}</Link>.
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
