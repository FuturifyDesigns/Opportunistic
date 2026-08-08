import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { prefersReducedMotion } from '../lib/animations'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789░▒▓█@#$%'

function scrambleLabel(len = 11) {
  let out = ''
  for (let i = 0; i < len; i += 1) {
    out += GLYPHS[(Math.random() * GLYPHS.length) | 0]
  }
  return out
}

/**
 * Full-viewport VHS / scramble wipe on route changes.
 * Covers the page swap, then tears away to reveal the new screen.
 */
export default function VhsPageTransition() {
  const location = useLocation()
  const rootRef = useRef(null)
  const labelRef = useRef(null)
  const firstRef = useRef(true)
  const busyRef = useRef(false)
  const tweenRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    if (firstRef.current) {
      firstRef.current = false
      return undefined
    }

    if (prefersReducedMotion()) return undefined
    if (busyRef.current) {
      tweenRef.current?.kill()
    }

    busyRef.current = true
    const label = labelRef.current
    const slices = root.querySelectorAll('.vhs-slice')
    const rgb = root.querySelectorAll('.vhs-rgb')
    const noise = root.querySelector('.vhs-noise')
    const scan = root.querySelector('.vhs-scan')
    const tracking = root.querySelector('.vhs-tracking')

    root.setAttribute('aria-hidden', 'false')
    root.classList.add('is-active')

    let scrambleTimer = 0
    if (label) {
      scrambleTimer = window.setInterval(() => {
        label.textContent = scrambleLabel(10 + ((Math.random() * 4) | 0))
      }, 40)
    }

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      onComplete: () => {
        window.clearInterval(scrambleTimer)
        if (label) label.textContent = ''
        root.classList.remove('is-active')
        root.setAttribute('aria-hidden', 'true')
        gsap.set(root, { clearProps: 'opacity' })
        busyRef.current = false
        tweenRef.current = null
      },
    })
    tweenRef.current = tl

    gsap.set(root, { opacity: 1, pointerEvents: 'none' })
    gsap.set(slices, { x: 0, opacity: 1, clearProps: 'transform' })
    gsap.set(rgb, { x: 0, opacity: 0.55 })
    gsap.set([noise, scan, tracking], { opacity: 1 })

    // Hit — hard cover + tear
    tl.fromTo(
      root,
      { opacity: 0 },
      { opacity: 1, duration: 0.06 },
    )
      .to(
        slices,
        {
          x: () => gsap.utils.random(-28, 28),
          duration: 0.08,
          stagger: { each: 0.02, from: 'random' },
          repeat: 3,
          yoyo: true,
        },
        0,
      )
      .to(
        rgb,
        {
          x: (i) => (i === 0 ? -10 : 10),
          opacity: 0.85,
          duration: 0.1,
          yoyo: true,
          repeat: 4,
        },
        0,
      )
      .to(
        tracking,
        {
          y: '+=18',
          duration: 0.12,
          yoyo: true,
          repeat: 3,
        },
        0,
      )
      .to(noise, { opacity: 0.9, duration: 0.15 }, 0.05)
      // Hold a beat of static
      .to({}, { duration: 0.12 })
      // Tear away
      .to(
        slices,
        {
          x: () => gsap.utils.random(-120, 120),
          opacity: 0,
          duration: 0.28,
          stagger: { each: 0.025, from: 'center' },
          ease: 'power2.in',
        },
        '>',
      )
      .to(rgb, { opacity: 0, duration: 0.2 }, '<')
      .to([noise, scan, tracking], { opacity: 0, duration: 0.22 }, '<0.05')
      .to(root, { opacity: 0, duration: 0.18, ease: 'power2.out' }, '<0.08')

    return () => {
      window.clearInterval(scrambleTimer)
      tl.kill()
      busyRef.current = false
    }
  }, [location.pathname])

  return (
    <div
      ref={rootRef}
      className="vhs-transition"
      aria-hidden="true"
      role="presentation"
    >
      <div className="vhs-veil" />
      <div className="vhs-rgb vhs-rgb-r" />
      <div className="vhs-rgb vhs-rgb-b" />
      <div className="vhs-slices" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className="vhs-slice" style={{ ['--i']: i }} />
        ))}
      </div>
      <div className="vhs-noise" />
      <div className="vhs-scan" />
      <div className="vhs-tracking" />
      <p ref={labelRef} className="vhs-scramble-label" />
    </div>
  )
}
