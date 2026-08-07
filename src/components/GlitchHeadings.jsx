import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  clearAllGlitchEnhancements,
  createHeadingGlitchObserver,
  enhanceAllHeadings,
} from '../lib/glitchText'

/** Applies Futurify-style scramble-on-hover; resets when route or language changes. */
export default function GlitchHeadings() {
  const location = useLocation()
  const { i18n } = useTranslation()

  useEffect(() => {
    const root = document.getElementById('root') || document.body
    clearAllGlitchEnhancements(root)
    const stop = createHeadingGlitchObserver(root)
    const t = window.setTimeout(() => enhanceAllHeadings(root), 40)
    return () => {
      window.clearTimeout(t)
      stop()
    }
  }, [location.pathname, location.search, i18n.language])

  useEffect(() => {
    const onLang = () => {
      const root = document.getElementById('root') || document.body
      clearAllGlitchEnhancements(root)
      window.requestAnimationFrame(() => enhanceAllHeadings(root))
    }
    i18n.on('languageChanged', onLang)
    return () => {
      i18n.off('languageChanged', onLang)
    }
  }, [i18n])

  return null
}
