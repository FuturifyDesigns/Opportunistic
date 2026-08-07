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
  const sweepRef = useRef(null)
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
    }, 520)
    return () => window.clearInterval(id)
  }, [t])

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        if (sweepRef.current) gsap.set(sweepRef.current, { opacity: 0.35 })
        return
      }

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      tl.from('.intro-veil', { opacity: 0, duration: 0.7 })
        .from('.intro-core', { scale: 0.82, opacity: 0, duration: 0.9 }, '-=0.25')
        .from('.intro-rings span:not(.intro-sweep)', { scale: 0.7, opacity: 0, stagger: 0.1, duration: 0.6 }, '-=0.6')
        .from('.intro-word', { y: 20, opacity: 0, duration: 0.55 }, '-=0.3')
        .from('.intro-log', { y: 14, opacity: 0, duration: 0.45 }, '-=0.2')
        .from('.intro-enter', { y: 10, opacity: 0, duration: 0.4 }, '-=0.1')

      gsap.to('.intro-rings .r2', {
        rotate: 360,
        duration: 48,
        repeat: -1,
        ease: 'none',
      })
      gsap.to('.intro-rings .r3', {
        rotate: -360,
        duration: 72,
        repeat: -1,
        ease: 'none',
      })

      if (sweepRef.current) {
        gsap.set(sweepRef.current, {
          opacity: 0.72,
          rotate: 0,
          force3D: true,
          transformOrigin: '50% 50%',
        })
        gsap.to(sweepRef.current, {
          rotate: 360,
          duration: 6.5,
          repeat: -1,
          ease: 'none',
          force3D: true,
        })
      }

      gsap.to('.intro-mark', {
        scale: 1.035,
        duration: 2.6,
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
    tl.to('.intro-enter, .intro-log, .intro-word', { opacity: 0, y: -14, duration: 0.3, stagger: 0.04 })
      .to('.intro-rings span', { scale: 1.4, opacity: 0, duration: 0.55, stagger: 0.04 }, '-=0.1')
      .to('.intro-core', { scale: 1.45, opacity: 0, duration: 0.55, ease: 'power2.in' }, '-=0.4')
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
          <div className="intro-core">
            <div className="intro-rings" aria-hidden="true">
              <span className="r1" />
              <span className="r2" />
              <span className="r3" />
              <span className="intro-sweep" ref={sweepRef} />
            </div>
            <div className="intro-mark-wrap">
              <img
                className="intro-mark"
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt={t('common.brand')}
                width="200"
                height="200"
              />
            </div>
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
    </div>
  )
}
