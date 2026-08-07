import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { createHeadingGlitchObserver, enhanceAllHeadings } from '../lib/glitchText'

/** Applies Futurify-style scramble-on-hover to headings site-wide. */
export default function GlitchHeadings() {
  const location = useLocation()

  useEffect(() => {
    const root = document.getElementById('root') || document.body
    const stop = createHeadingGlitchObserver(root)
    const t = window.setTimeout(() => enhanceAllHeadings(root), 50)
    return () => {
      window.clearTimeout(t)
      stop()
    }
  }, [location.pathname, location.search])

  return null
}
