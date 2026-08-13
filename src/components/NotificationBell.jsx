import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useNotifications } from '../context/NotificationContext'
import { useToast } from '../context/ToastContext'
import UserAvatar from './UserAvatar'

export default function NotificationBell() {
  const { t } = useTranslation()
  const toast = useToast()
  const { count, requests, recs, unread, acceptRequest, declineRequest, dismissRec } = useNotifications()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
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

  async function onAccept(userId) {
    try {
      await acceptRequest(userId)
      toast.success(t('hub.friendAccepted'))
    } catch (err) {
      toast.error(err.message || t('common.toast.genericError'))
    }
  }

  async function onDecline(userId) {
    try {
      await declineRequest(userId)
    } catch (err) {
      toast.error(err.message || t('common.toast.genericError'))
    }
  }

  async function onDismissRec(id) {
    try {
      await dismissRec(id)
    } catch (err) {
      toast.error(err.message || t('common.toast.genericError'))
    }
  }

  return (
    <div className={`notify-bell ${open ? 'open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="notify-bell-btn"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t('notify.title')}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {count > 0 ? <span className="notify-badge">{count > 9 ? '9+' : count}</span> : null}
      </button>

      {open ? (
        <div className="notify-panel" role="menu">
          <p className="notify-panel-title">{t('notify.title')}</p>
          {!count ? <p className="muted notify-empty">{t('notify.empty')}</p> : null}

          {requests.map((req) => (
            <div key={`fr-${req.user_id}`} className="notify-item">
              <UserAvatar url={req.avatar_url} name={req.full_name} size={36} />
              <div>
                <p>
                  {t('notify.friendRequest', { name: req.full_name })}
                </p>
                <div className="notify-item-actions">
                  <button type="button" className="btn btn-sm" onClick={() => void onAccept(req.user_id)}>
                    {t('notify.accept')}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void onDecline(req.user_id)}>
                    {t('notify.decline')}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {recs.map((rec) => (
            <div key={`rec-${rec.id}`} className="notify-item">
              <UserAvatar url={rec.from_avatar} name={rec.from_name} size={36} />
              <div>
                <p>
                  {t('notify.recItem', { name: rec.from_name, title: rec.title })}
                </p>
                <div className="notify-item-actions">
                  <NavLink className="btn btn-sm" to={`/match/rec/${rec.id}`} onClick={() => setOpen(false)}>
                    {t('notify.viewRec')}
                  </NavLink>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void onDismissRec(rec.id)}>
                    {t('recommend.dismiss')}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {unread > 0 ? (
            <NavLink className="notify-item notify-link" to="/hub" state={{ tab: 'chats' }} onClick={() => setOpen(false)}>
              <span className="notify-unread-dot" aria-hidden />
              <span>{t('notify.unread', { count: unread })}</span>
            </NavLink>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
