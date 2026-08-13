import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { listFriends, recommendMatch } from '../lib/collabHub'
import { useToast } from '../context/ToastContext'
import UserAvatar from './UserAvatar'
import CensoredText from './CensoredText'

export default function RecommendMatchDialog({ open, match, kind, onClose }) {
  const { t } = useTranslation()
  const toast = useToast()
  const [people, setPeople] = useState([])
  const [query, setQuery] = useState('')
  const [note, setNote] = useState('')
  const [picked, setPicked] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    setQuery('')
    setNote('')
    setPicked(null)
    let live = true
    setLoading(true)
    listFriends()
      .then((friends) => {
        if (!live) return
        setPeople((friends || []).filter((row) => row?.user_id))
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    return () => {
      live = false
    }
  }, [open])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return people
    return people.filter((p) =>
      [p.full_name, p.headline, p.country].join(' ').toLowerCase().includes(q),
    )
  }, [people, query])

  async function send() {
    if (!picked?.user_id || !match?.url || sending) return
    setSending(true)
    try {
      await recommendMatch({
        toUserId: picked.user_id,
        kind: kind === 'scholarships' || kind === 'scholarship' ? 'scholarship' : 'job',
        title: match.title,
        url: match.url,
        company: match.company,
        location: match.location,
        source: match.source,
        deadline: match.deadline,
        matchScore: match.match_score,
        note,
      })
      toast.success(t('recommend.sent', { name: picked.full_name || t('hub.dmFallback') }))
      onClose?.()
    } catch (err) {
      toast.error(err.message || t('recommend.error'))
    } finally {
      setSending(false)
    }
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="confirm-backdrop rec-backdrop" role="presentation" onClick={() => onClose?.()}>
      <div
        className="confirm-dialog rec-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rec-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="eyebrow">{t('recommend.eyebrow')}</p>
        <h2 id="rec-dialog-title">{t('recommend.title')}</h2>
        <p className="muted rec-listing">
          <CensoredText text={match?.title || ''} />
          {match?.company ? ` · ${match.company}` : ''}
        </p>
        <label className="rec-search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('recommend.searchPh')}
            aria-label={t('recommend.search')}
          />
        </label>
        <div className="rec-people" role="listbox" aria-label={t('recommend.people')}>
          {loading ? <p className="muted">{t('common.loading')}</p> : null}
          {!loading && !visible.length ? <p className="muted">{t('recommend.empty')}</p> : null}
          {visible.map((person) => (
            <button
              key={person.user_id}
              type="button"
              role="option"
              aria-selected={picked?.user_id === person.user_id}
              className={`rec-person${picked?.user_id === person.user_id ? ' selected' : ''}`}
              onClick={() => setPicked(person)}
            >
              <UserAvatar url={person.avatar_url} name={person.full_name} size={36} />
              <span>
                <strong>
                  <CensoredText text={person.full_name} />
                </strong>
                {person.headline ? (
                  <em>
                    <CensoredText text={person.headline} />
                  </em>
                ) : null}
              </span>
            </button>
          ))}
        </div>
        <label className="rec-note">
          <span>{t('recommend.note')}</span>
          <textarea
            rows={2}
            maxLength={400}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('recommend.notePh')}
          />
        </label>
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={() => onClose?.()}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn" disabled={!picked || sending} onClick={() => void send()}>
            {sending ? t('recommend.sending') : t('recommend.send')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
