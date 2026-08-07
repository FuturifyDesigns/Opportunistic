import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, nativeLanguageName } from '../i18n/languages'

export default function LanguageSwitcher({ compact = false }) {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef(null)
  const inputRef = useRef(null)

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

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  function pick(code) {
    void i18n.changeLanguage(code).then(() => {
      setOpen(false)
    })
  }

  const label = nativeLanguageName(current, current)

  return (
    <div className={`lang-switch ${compact ? 'compact' : ''}`} ref={root}>
      <button
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

      {open ? (
        <div className="lang-switch-panel" role="listbox" aria-label={t('common.chooseLanguage')}>
          <input
            ref={inputRef}
            type="search"
            className="lang-switch-search"
            placeholder={t('common.searchLanguages')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
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
                  <span>{lang.native}</span>
                  <em>{lang.name}</em>
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
      ) : null}
    </div>
  )
}
