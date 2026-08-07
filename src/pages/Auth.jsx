import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import PageBackdrop from '../components/PageBackdrop'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

function validate(mode, { fullName, email, password, confirm }, t) {
  const errors = {}
  if (mode === 'signup') {
    if (!fullName.trim()) errors.fullName = t('auth.errNameRequired')
    else if (fullName.trim().length < 2) errors.fullName = t('auth.errNameShort')
  }
  if (!email.trim()) errors.email = t('auth.errEmailRequired')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = t('auth.errEmailInvalid')
  if (!password) errors.password = t('auth.errPasswordRequired')
  else if (password.length < 8) errors.password = t('auth.errPasswordShort')
  else if (mode === 'signup' && !/[A-Za-z]/.test(password)) errors.password = t('auth.errPasswordLetter')
  else if (mode === 'signup' && !/[0-9]/.test(password)) errors.password = t('auth.errPasswordNumber')
  if (mode === 'signup') {
    if (!confirm) errors.confirm = t('auth.errConfirmRequired')
    else if (confirm !== password) errors.confirm = t('auth.errPasswordMismatch')
  }
  return errors
}

export default function Auth() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile, loading } = useAuth()
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

  const title = mode === 'signup' ? t('auth.createAccount') : t('auth.signIn')
  const errors = useMemo(
    () => validate(mode, { fullName, email, password, confirm }, t),
    [mode, fullName, email, password, confirm, t],
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
    if (hasErrors) {
      setMessage(t('auth.errEmailRequired'))
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
          setMessage(t('auth.checkEmail'))
          setMode('login')
        } else {
          navigate('/onboarding')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
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
                <form className="stack-form" onSubmit={onSubmit} noValidate>
                  {mode === 'signup' ? (
                    <label className={`auth-field ${touched.fullName && errors.fullName ? 'invalid' : ''}`}>
                      {t('auth.fullName')}
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
                  <label className={`auth-field ${touched.email && errors.email ? 'invalid' : ''}`}>
                    {t('auth.email')}
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
                    {t('auth.password')}
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
                        {showPass ? t('auth.hidePassword') : t('auth.showPassword')}
                      </button>
                    </div>
                    {touched.password && errors.password ? <span className="field-error">{errors.password}</span> : null}
                  </label>
                  {mode === 'signup' ? (
                    <label className={`auth-field ${touched.confirm && errors.confirm ? 'invalid' : ''}`}>
                      {t('auth.confirmPassword')}
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
                  {message ? <p className="form-message">{message}</p> : null}
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
