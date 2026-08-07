import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, nativeLanguageName } from '../i18n/languages'
import { changeAppLanguage } from '../i18n'
import { useToast } from '../context/ToastContext'

function useIsNarrow(max = 860) {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${max}px)`).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${max}px)`)
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener?.('change', sync)
    return () => mq.removeEventListener?.('change', sync)
  }, [max])

  return narrow
}

export default function LanguageSwitcher({ compact = false, onPick }) {
  const { i18n, t } = useTranslation()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [panelStyle, setPanelStyle] = useState(null)
  const root = useRef(null)
  const btnRef = useRef(null)
  const panelRef = useRef(null)
  const inputRef = useRef(null)
  const narrow = useIsNarrow(860)

  const current = i18n.resolvedLanguage || i18n.language || 'en'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = LANGUAGES.map((lang) => ({
      ...lang,
      native: nativeLanguageName(lang.code, current),
    }))
    if (!q) return list
    return list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    )
  }, [query, current])

  useLayoutEffect(() => {
    if (!open) {
      setPanelStyle(null)
      return
    }
    if (narrow) {
      setPanelStyle(null)
      return
    }
    const btn = btnRef.current
    if (!btn) return

    const place = () => {
      const rect = btn.getBoundingClientRect()
      const width = Math.min(300, window.innerWidth - 24)
      let left = rect.right - width
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12))
      const spaceBelow = window.innerHeight - rect.bottom - 16
      const spaceAbove = rect.top - 16
      const openUp = spaceBelow < 280 && spaceAbove > spaceBelow
      const maxHeight = Math.min(320, openUp ? spaceAbove - 8 : spaceBelow - 8)
      setPanelStyle({
        position: 'fixed',
        width,
        left,
        maxHeight: Math.max(180, maxHeight),
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 8, top: 'auto' }
          : { top: rect.bottom + 8, bottom: 'auto' }),
      })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, narrow])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      const tEl = e.target
      if (root.current?.contains(tEl) || panelRef.current?.contains(tEl)) return
      setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('touchstart', onDoc, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('touchstart', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setQuery('')
    const prev = document.body.style.overflow
    if (narrow) document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => inputRef.current?.focus())
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, narrow])

  function pick(code) {
    void changeAppLanguage(code).then(() => {
      setOpen(false)
      toast.success(t('common.toast.languageChanged'))
      onPick?.(code)
    })
  }

  const label = nativeLanguageName(current, current)

  const panel = open
    ? createPortal(
        <>
          <button
            type="button"
            className={`lang-switch-backdrop ${narrow ? 'show' : ''}`}
            aria-label={t('common.close', { defaultValue: 'Close' })}
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            className={`lang-switch-panel ${narrow ? 'sheet' : 'anchored'}`}
            style={narrow ? undefined : panelStyle || { visibility: 'hidden' }}
            role="listbox"
            aria-label={t('common.chooseLanguage')}
          >
            <div className="lang-switch-sheet-head">
              <p className="lang-switch-sheet-title">{t('common.chooseLanguage')}</p>
              <button type="button" className="lang-switch-sheet-close" onClick={() => setOpen(false)}>
                {t('common.close', { defaultValue: 'Close' })}
              </button>
            </div>
            <input
              ref={inputRef}
              type="search"
              className="lang-switch-search"
              placeholder={t('common.searchLanguages')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              enterKeyHint="search"
            />
            <ul className="lang-switch-list">
              {filtered.map((lang) => (
                <li key={lang.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={lang.code === current}
                    className={lang.code === current ? 'active' : ''}
                    onClick={() => pick(lang.code)}
                  >
                    <span className="lang-switch-native">{lang.native}</span>
                    <em className="lang-switch-english">
                      {lang.name}
                      <span className="lang-switch-code-tag">{lang.code}</span>
                    </em>
                  </button>
                </li>
              ))}
              {!filtered.length ? (
                <li className="lang-switch-empty">
                  <span>{t('common.search')}</span>
                </li>
              ) : null}
            </ul>
          </div>
        </>,
        document.body,
      )
    : null

  return (
    <div className={`lang-switch ${compact ? 'compact' : ''} ${open ? 'open' : ''}`} ref={root}>
      <button
        ref={btnRef}
        type="button"
        className="lang-switch-btn"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('common.chooseLanguage')}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="lang-switch-code">{current.split('-')[0].toUpperCase()}</span>
        {!compact ? <span className="lang-switch-name">{label}</span> : null}
      </button>
      {panel}
    </div>
  )
}
