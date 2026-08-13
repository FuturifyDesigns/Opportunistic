import { usePresenceFor } from '../context/PresenceContext'

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export default function UserAvatar({ url, name = '', size = 40, className = '', presenceUserId, lastSeenAt, showPresence = false }) {
  const { online } = usePresenceFor(showPresence ? presenceUserId : null, lastSeenAt)
  const showDot = Boolean(showPresence && presenceUserId)

  return (
    <span className={`user-avatar-wrap ${className}`.trim()} style={{ width: size, height: size }}>
      <span className="user-avatar" style={{ width: size, height: size }} aria-hidden={!url}>
        {url ? <img src={url} alt="" /> : initials(name)}
      </span>
      {showDot ? (
        <span className={`user-presence-dot ${online ? 'online' : 'offline'}`} aria-hidden />
      ) : null}
    </span>
  )
}
