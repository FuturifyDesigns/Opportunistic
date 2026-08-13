import { useTranslation } from 'react-i18next'
import { usePresenceFor } from '../context/PresenceContext'

export function formatPresenceLabel(online, lastSeenAt, t) {
  if (online) return t('hub.presenceOnline')
  if (!lastSeenAt) return t('hub.presenceOffline')
  const diff = Date.now() - new Date(lastSeenAt).getTime()
  if (!Number.isFinite(diff) || diff < 0) return t('hub.presenceOffline')
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return t('hub.presenceJustNow')
  if (mins < 60) return t('hub.presenceMinutes', { count: mins })
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return t('hub.presenceHours', { count: hrs })
  const days = Math.floor(hrs / 24)
  if (days < 7) return t('hub.presenceDays', { count: days })
  try {
    return t('hub.presenceDate', {
      when: new Date(lastSeenAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    })
  } catch {
    return t('hub.presenceOffline')
  }
}

export default function PresenceStatus({ userId, lastSeenAt, className = '' }) {
  const { t } = useTranslation()
  const { online, lastSeen } = usePresenceFor(userId, lastSeenAt)
  return (
    <span className={`presence-status ${online ? 'is-online' : 'is-offline'} ${className}`.trim()}>
      {formatPresenceLabel(online, lastSeen, t)}
    </span>
  )
}
