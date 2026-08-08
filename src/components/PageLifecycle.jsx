import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { prefersReducedMotion } from '../lib/animations'
import { trackPageView, trackEvent } from '../lib/analytics'
import { useAuth } from '../context/AuthContext'

function scrollPageToTop() {
  const html = document.documentElement
  const prev = html.style.scrollBehavior
  html.style.scrollBehavior = 'auto'
  window.scrollTo(0, 0)
  document.body.scrollTop = 0
  html.scrollTop = 0
  html.style.scrollBehavior = prev
}

/**
 * Scroll to top on route change, soft fade-in of page content, and live analytics.
 */
export default function PageLifecycle() {
  const location = useLocation()
  const { user } = useAuth()
  const firstRef = useRef(true)
  const tweenRef = useRef(null)

  useEffect(() => {
    scrollPageToTop()
    const shell = document.getElementById('page-shell')
    tweenRef.current?.kill()

    trackPageView(location.pathname, user?.id)

    if (firstRef.current) {
      firstRef.current = false
      if (shell) gsap.set(shell, { opacity: 1, y: 0, clearProps: 'transform' })
      return undefined
    }

    if (!shell || prefersReducedMotion()) {
      if (shell) gsap.set(shell, { opacity: 1, y: 0, clearProps: 'transform' })
      return undefined
    }

    gsap.set(shell, { opacity: 0, y: 10 })
    tweenRef.current = gsap.to(shell, {
      opacity: 1,
      y: 0,
      duration: 0.45,
      ease: 'power2.out',
      onStart: () => scrollPageToTop(),
    })

    return () => {
      tweenRef.current?.kill()
      if (shell) gsap.set(shell, { opacity: 1, y: 0, clearProps: 'transform' })
    }
  }, [location.pathname, user?.id])

  // Presence heartbeat while the tab is visible
  useEffect(() => {
    const beat = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      trackEvent('heartbeat', { path: location.pathname, userId: user?.id })
    }
    beat()
    const id = window.setInterval(beat, 45000)
    const onVis = () => {
      if (document.visibilityState === 'visible') beat()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [location.pathname, user?.id])

  return null
}
