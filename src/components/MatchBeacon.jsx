import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { prefersReducedMotion } from '../lib/animations'

function cleanStatus(line) {
  return String(line || '').replace(/^>\s*/, '').trim()
}

/**
 * Full-screen white match sequence: logo + search beacon + oval status pills
 * that fade in / out one at a time.
 */
export default function MatchBeacon({ active, lines = [], done = false, error = '' }) {
  const { t } = useTranslation()
  const root = useRef(null)
  const sweepRef = useRef(null)
  const pillRef = useRef(null)
  const shownRef = useRef('')
  const [pillText, setPillText] = useState('')
  const [pillTone, setPillTone] = useState('idle') // idle | status | done | error

  useEffect(() => {
    if (!active || !root.current) return undefined
    if (prefersReducedMotion()) {
      gsap.set('.mb-core, .mb-word, .mb-status', { opacity: 1, clearProps: 'transform' })
      return undefined
    }

    const ctx = gsap.context(() => {
      gsap.fromTo('.mb-veil', { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' })
      gsap.fromTo(
        '.mb-core',
        { scale: 0.82, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.1 },
      )
      gsap.fromTo('.mb-word', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, delay: 0.35 })
      gsap.fromTo('.mb-status', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, delay: 0.4 })

      gsap.to('.mb-ring.r2', { rotate: 360, duration: 42, repeat: -1, ease: 'none' })
      gsap.to('.mb-ring.r3', { rotate: -360, duration: 64, repeat: -1, ease: 'none' })

      if (sweepRef.current) {
        gsap.set(sweepRef.current, {
          opacity: 0.85,
          rotate: 0,
          force3D: true,
          transformOrigin: '50% 50%',
        })
        gsap.to(sweepRef.current, {
          rotate: 360,
          duration: 5.2,
          repeat: -1,
          ease: 'none',
          force3D: true,
        })
      }

      gsap.to('.mb-mark', {
        scale: 1.04,
        duration: 2.4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
    }, root)

    return () => ctx.revert()
  }, [active])

  useEffect(() => {
    if (!active) {
      shownRef.current = ''
      setPillText('')
      setPillTone('idle')
      return undefined
    }

    let targetText = ''
    let targetTone = 'idle'

    if (error) {
      targetText = error
      targetTone = 'error'
    } else if (done) {
      targetText = t('onboarding.beaconReady')
      targetTone = 'done'
    } else if (lines.length) {
      targetText = cleanStatus(lines[lines.length - 1])
      targetTone = 'status'
    } else {
      targetText = t('onboarding.beaconWorking')
      targetTone = 'idle'
    }

    const signature = `${targetTone}:${targetText}`
    if (!targetText || signature === shownRef.current) return undefined
    const previous = shownRef.current
    shownRef.current = signature

    const el = pillRef.current
    const reduced = prefersReducedMotion()

    if (reduced || !el || !previous) {
      setPillText(targetText)
      setPillTone(targetTone)
      if (el && !reduced) {
        gsap.fromTo(
          el,
          { opacity: 0, y: 12, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out' },
        )
      }
      return undefined
    }

    let cancelled = false
    gsap.to(el, {
      opacity: 0,
      y: -10,
      scale: 0.96,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => {
        if (cancelled) return
        setPillText(targetText)
        setPillTone(targetTone)
        requestAnimationFrame(() => {
          if (cancelled || !pillRef.current) return
          gsap.fromTo(
            pillRef.current,
            { opacity: 0, y: 14, scale: 0.94 },
            { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'power2.out' },
          )
        })
      },
    })

    return () => {
      cancelled = true
    }
  }, [active, lines, done, error, t])

  if (!active) return null

  const pillClass =
    pillTone === 'done'
      ? 'mb-pill mb-pill-done'
      : pillTone === 'error'
        ? 'mb-pill mb-pill-error'
        : pillTone === 'idle'
          ? 'mb-pill mb-pill-muted'
          : 'mb-pill'

  return (
    <div className="match-beacon" ref={root} role="status" aria-live="polite">
      <div className="mb-veil" aria-hidden="true" />
      <div className="mb-stage">
        <div className="mb-core">
          <div className="mb-rings" aria-hidden="true">
            <span className="mb-ring r1" />
            <span className="mb-ring r2" />
            <span className="mb-ring r3" />
            <span className="mb-sweep" ref={sweepRef} />
          </div>
          <div className="mb-mark-wrap">
            <img
              className="mb-mark"
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt=""
              width="160"
              height="160"
            />
          </div>
        </div>
        <p className="mb-word">{t('common.brand')}</p>
        <div className="mb-status">
          <p className={pillClass} ref={pillRef}>
            {pillText || t('onboarding.beaconWorking')}
          </p>
        </div>
      </div>
    </div>
  )
}
