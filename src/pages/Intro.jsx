import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

const INTRO_KEY = 'opp_intro_seen'

export function hasSeenIntro() {
  try {
    return sessionStorage.getItem(INTRO_KEY) === '1'
  } catch {
    return false
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_KEY, '1')
  } catch {
    /* ignore */
  }
}

export default function Intro() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const root = useRef(null)
  const [ready, setReady] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [logs, setLogs] = useState([])
  const entered = useRef(false)

  useEffect(() => {
    document.title = t('intro.docTitle')
    if (hasSeenIntro()) {
      navigate('/home', { replace: true })
    }
  }, [navigate, t])

  useEffect(() => {
    const lines = [
      t('intro.log1'),
      t('intro.log2'),
      t('intro.log3'),
      t('intro.log4'),
      t('intro.log5'),
    ]
    if (prefersReducedMotion()) {
      setLogs(lines)
      setReady(true)
      return undefined
    }
    setLogs([])
    let i = 0
    const id = window.setInterval(() => {
      setLogs((prev) => [...prev, lines[i]])
      i += 1
      if (i >= lines.length) {
        window.clearInterval(id)
        setReady(true)
      }
    }, 480)
    return () => window.clearInterval(id)
  }, [t])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      tl.from('.intro-veil', { opacity: 0, duration: 0.6 })
        .from('.intro-mark-wrap', { scale: 0.72, opacity: 0, duration: 0.85 }, '-=0.2')
        .from('.intro-rings span', { scale: 0.6, opacity: 0, stagger: 0.1, duration: 0.55 }, '-=0.55')
        .from('.intro-word', { y: 24, opacity: 0, duration: 0.5 }, '-=0.25')
        .from('.intro-log', { y: 16, opacity: 0, duration: 0.4 }, '-=0.2')
        .from('.intro-enter', { y: 12, opacity: 0, duration: 0.35 }, '-=0.05')

      gsap.to('.intro-rings .r2', {
        rotate: 360,
        duration: 42,
        repeat: -1,
        ease: 'none',
      })
      gsap.to('.intro-rings .r3', {
        rotate: -360,
        duration: 64,
        repeat: -1,
        ease: 'none',
      })
      gsap.to('.intro-mark', {
        scale: 1.04,
        duration: 2.4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
    },
    { scope: root },
  )

  function enter() {
    if (entered.current || exiting) return
    entered.current = true
    setExiting(true)
    markIntroSeen()

    const go = () => navigate('/home', { replace: true })

    if (prefersReducedMotion() || !root.current) {
      go()
      return
    }

    const tl = gsap.timeline({ onComplete: go })
    tl.to('.intro-enter, .intro-log, .intro-word', { opacity: 0, y: -12, duration: 0.28, stagger: 0.04 })
      .to('.intro-rings span', { scale: 1.35, opacity: 0, duration: 0.55, stagger: 0.05 }, '-=0.1')
      .to('.intro-mark-wrap', { scale: 1.5, opacity: 0, duration: 0.55, ease: 'power2.in' }, '-=0.4')
      .to('.intro-veil', { opacity: 0, duration: 0.35 }, '-=0.2')
  }

  return (
    <div
      ref={root}
      className={`intro-page${ready ? ' is-ready' : ''}${exiting ? ' is-exiting' : ''}`}
    >
      <div className="intro-veil" aria-hidden="true" />
      <button type="button" className="intro-hit" onClick={enter} aria-label={t('intro.enter')}>
        <div className="intro-stage">
          <div className="intro-rings" aria-hidden="true">
            <span className="r1" />
            <span className="r2" />
            <span className="r3" />
            <span className="intro-sweep" />
          </div>

          <div className="intro-mark-wrap">
            <img
              className="intro-mark"
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt={t('common.brand')}
              width="160"
              height="160"
            />
          </div>

          <p className="intro-word">{t('common.brand')}</p>

          <div className="intro-log" aria-live="polite">
            {logs.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {!ready ? <span className="log-cursor" aria-hidden="true" /> : null}
          </div>

          <span className={`intro-enter${ready ? ' show' : ''}`}>
            {ready ? t('intro.enterHint') : t('intro.booting')}
          </span>
        </div>
      </button>

      <button type="button" className="intro-skip" onClick={enter}>
        {t('intro.skip')}
      </button>
    </div>
  )
}
