import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

/** Animated logo CTA replacing a plain Sign in button */
export default function GetStartedLogo({ onClick }) {
  const root = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const mark = root.current?.querySelector('.cta-logo-mark')
      const hint = root.current?.querySelector('.cta-logo-hint')
      if (!mark) return

      gsap.to(mark, {
        y: -3,
        duration: 1.4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
      gsap.to(mark, {
        rotate: 8,
        duration: 2.2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 0.2,
      })
      gsap.fromTo(
        hint,
        { opacity: 0.55 },
        { opacity: 1, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut' },
      )
    },
    { scope: root },
  )

  useEffect(() => {
    // ensure hint visible if gsap skipped
  }, [])

  return (
    <Link
      ref={root}
      to="/auth?mode=signup"
      className="cta-logo"
      onClick={onClick}
      aria-label="Get started with Opportunistic"
    >
      <img
        className="cta-logo-mark"
        src={`${import.meta.env.BASE_URL}logo.png`}
        alt=""
        width="36"
        height="36"
      />
      <span className="cta-logo-text">
        <strong>Opportunistic</strong>
        <em className="cta-logo-hint">Get started</em>
      </span>
    </Link>
  )
}
