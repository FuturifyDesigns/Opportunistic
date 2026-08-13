export default function UserAvatar({ url, name = '', size = 40, className = '' }) {
  const initial = String(name || '?')
    .trim()
    .slice(0, 1)
    .toUpperCase() || '?'

  return (
    <span className={`user-avatar ${className}`.trim()} style={{ width: size, height: size }}>
      {url ? <img src={url} alt="" /> : <span className="user-avatar-fallback">{initial}</span>}
    </span>
  )
}
