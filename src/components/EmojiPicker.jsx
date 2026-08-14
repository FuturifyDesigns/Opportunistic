import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { searchEmojis } from '../lib/emojiCatalog'

export default function EmojiPicker({ onPick, open, onOpenChange }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const inputRef = useRef(null)

  const items = useMemo(() => searchEmojis(query).slice(0, 420), [query])

  useEffect(() => {
    if (!open) return undefined
    setQuery('')
    const id = window.setTimeout(() => inputRef.current?.focus(), 30)
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) onOpenChange?.(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onOpenChange?.(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  return (
    <div className={`emoji-picker ${open ? 'open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="emoji-picker-btn"
        aria-expanded={open}
        aria-label={t('hub.emojiAria')}
        onClick={() => onOpenChange?.(!open)}
      >
        😊
      </button>
      {open ? (
        <div className="emoji-picker-panel" role="dialog" aria-label={t('hub.emojiTitle')}>
          <input
            ref={inputRef}
            className="emoji-picker-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('hub.emojiSearch')}
            aria-label={t('hub.emojiSearch')}
          />
          <div className="emoji-picker-grid" role="listbox">
            {items.length ? (
              items.map((item) => (
                <button
                  key={`${item.e}-${item.n}`}
                  type="button"
                  className="emoji-picker-item"
                  title={item.n}
                  aria-label={item.n}
                  onClick={() => {
                    onPick?.(item.e)
                    onOpenChange?.(false)
                  }}
                >
                  {item.e}
                </button>
              ))
            ) : (
              <p className="muted emoji-picker-empty">{t('hub.emojiEmpty')}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
