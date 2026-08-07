import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { prefersReducedMotion } from '../lib/animations'

/**
 * Full-screen white match sequence: logo + search beacon + bottom status lines.
 */
export default function MatchBeacon({ active, lines = [], done = false, error = '' }) {
  const { t } = useTranslation()
  const root = useRef(null)
  const sweepRef = useRef(null)

  useEffect(() => {
    if (!active || !root.current) return undefined
    if (prefersReducedMotion()) {
      gsap.set('.mb-core, .mb-word, .mb-logs, .mb-done', { opacity: 1, clearProps: 'transform' })
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
      gsap.fromTo('.mb-logs', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, delay: 0.45 })

      gsap.to('.mb-ring.r2', { rotate: 360, duration: 42, repeat: -1, ease: 'none' })
      gsap.to('.mb-ring.r3', { rotate: -360, duration: 64, repeat: -1, ease: 'none' })

      if (sweepRef.current) {
        gsap.set(sweepRef.current, { opacity: 0.85, rotate: 0, force3D: true, transformOrigin: '50% 50%' })
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
    if (!active || !done || prefersReducedMotion()) return
    gsap.fromTo('.mb-done', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
  }, [active, done])

  if (!active) return null

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
      </div>

      <div className="mb-footer">
        <div className="mb-logs">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {!done && !error ? <span className="log-cursor" aria-hidden="true" /> : null}
        </div>
        {error ? <p className="mb-error">{error}</p> : null}
        {done && !error ? <p className="mb-done">{t('onboarding.beaconReady')}</p> : null}
      </div>
    </div>
  )
}
