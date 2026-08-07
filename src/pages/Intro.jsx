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

const CARDS = [
  { key: 'pathway', slot: 'tl' },
  { key: 'sync', slot: 'tr' },
  { key: 'reason', slot: 'ml' },
  { key: 'lane', slot: 'mr' },
]

export default function Intro() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const root = useRef(null)
  const sweepRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [visibleCount, setVisibleCount] = useState(0)
  const entered = useRef(false)

  useEffect(() => {
    document.title = t('intro.docTitle')
    if (hasSeenIntro()) {
      navigate('/home', { replace: true })
    }
  }, [navigate, t])

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisibleCount(CARDS.length)
      setReady(true)
      return undefined
    }
    setVisibleCount(0)
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setVisibleCount(i)
      if (i >= CARDS.length) {
        window.clearInterval(id)
        setReady(true)
      }
    }, 380)
    return () => window.clearInterval(id)
  }, [])

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        if (sweepRef.current) gsap.set(sweepRef.current, { opacity: 0.22 })
        return
      }

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      tl.from('.intro-core', { scale: 0.88, opacity: 0, duration: 0.8 })
        .from('.intro-rings span:not(.intro-sweep)', { scale: 0.75, opacity: 0, stagger: 0.08, duration: 0.5 }, '-=0.55')
        .from('.intro-word', { y: 16, opacity: 0, duration: 0.45, clearProps: 'transform' }, '-=0.25')

      gsap.set('.intro-enter', { clearProps: 'opacity,transform,visibility' })

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
          opacity: 0.85,
          rotate: 0,
          force3D: true,
          transformOrigin: '50% 50%',
        })
        gsap.to(sweepRef.current, {
          rotate: 360,
          duration: 5.5,
          repeat: -1,
          ease: 'none',
          force3D: true,
        })
      }

      gsap.to('.intro-mark', {
        scale: 1.03,
        duration: 2.6,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
    },
    { scope: root },
  )

  useGSAP(
    () => {
      const cards = root.current?.querySelectorAll('.intro-card.is-on:not(.is-shown)')
      if (!cards?.length) return
      cards.forEach((el) => el.classList.add('is-shown'))
      if (prefersReducedMotion()) {
        gsap.set(cards, { opacity: 1, clearProps: 'transform' })
        return
      }
      gsap.fromTo(
        cards,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.06,
          ease: 'power2.out',
          onComplete: () => {
            if (prefersReducedMotion()) return
            cards.forEach((el, i) => {
              gsap.to(el, {
                y: i % 2 === 0 ? -7 : -10,
                duration: 2.2 + i * 0.25,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut',
                delay: i * 0.15,
              })
            })
          },
        },
      )
    },
    { scope: root, dependencies: [visibleCount] },
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
    tl.to('.intro-enter, .intro-card, .intro-word', { opacity: 0, duration: 0.28, stagger: 0.03 })
      .to('.intro-rings span', { scale: 1.35, opacity: 0, duration: 0.5, stagger: 0.04 }, '-=0.1')
      .to('.intro-core', { scale: 1.35, opacity: 0, duration: 0.5, ease: 'power2.in' }, '-=0.35')
  }

  return (
    <div
      ref={root}
      className={`intro-page${ready ? ' is-ready' : ''}${exiting ? ' is-exiting' : ''}`}
    >
      <button type="button" className="intro-hit" onClick={enter} aria-label={t('intro.enter')}>
        <div className="intro-stage">
          <div className="intro-orbit">
            {CARDS.map((card, index) => (
              <article
                key={card.key}
                className={`intro-card slot-${card.slot}${index < visibleCount ? ' is-on' : ''}`}
                aria-hidden={index >= visibleCount}
              >
                <span className="intro-card-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h2>{t(`intro.cards.${card.key}.title`)}</h2>
                <p>{t(`intro.cards.${card.key}.body`)}</p>
              </article>
            ))}

              <div className="intro-center">
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
              <span className="intro-enter show" aria-hidden="false">
                <span className="intro-enter-label">{ready ? t('intro.enterHint') : t('intro.booting')}</span>
                <span className="intro-enter-arrow" aria-hidden="true">
                  →
                </span>
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}
