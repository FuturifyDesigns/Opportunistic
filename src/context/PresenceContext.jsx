import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const PresenceContext = createContext(null)
const CHANNEL = 'opp-presence'
const HEARTBEAT_MS = 45_000

async function touchLastSeen() {
  try {
    await supabase.rpc('touch_last_seen')
  } catch {
    /* ignore */
  }
}

export function PresenceProvider({ children }) {
  const { user } = useAuth()
  const [onlineIds, setOnlineIds] = useState(() => new Set())
  const [lastSeenMap, setLastSeenMap] = useState({})
  const [, setTick] = useState(0)
  const prevOnlineRef = useRef(new Set())

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!user?.id) {
      prevOnlineRef.current = new Set()
      setOnlineIds(new Set())
      return undefined
    }

    const channel = supabase.channel(CHANNEL, {
      config: { presence: { key: user.id } },
    })

    const syncPresence = () => {
      const state = channel.presenceState()
      const next = new Set(Object.keys(state))
      const prev = prevOnlineRef.current
      const leftNow = {}
      prev.forEach((id) => {
        if (!next.has(id) && id !== user.id) {
          leftNow[id] = new Date().toISOString()
        }
      })
      prevOnlineRef.current = next
      setOnlineIds(next)
      if (Object.keys(leftNow).length) {
        setLastSeenMap((m) => ({ ...m, ...leftNow }))
      }
    }

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return
        await channel.track({ user_id: user.id, at: Date.now() })
        await touchLastSeen()
      })

    const beat = window.setInterval(() => {
      void channel.track({ user_id: user.id, at: Date.now() })
      void touchLastSeen()
    }, HEARTBEAT_MS)

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void channel.track({ user_id: user.id, at: Date.now() })
        void touchLastSeen()
      } else {
        void channel.untrack()
        void touchLastSeen()
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      window.clearInterval(beat)
      document.removeEventListener('visibilitychange', onVis)
      void touchLastSeen()
      void supabase.removeChannel(channel)
    }
  }, [user?.id])

  const seedLastSeen = useCallback((rows) => {
    if (!Array.isArray(rows) || !rows.length) return
    setLastSeenMap((m) => {
      const next = { ...m }
      rows.forEach((row) => {
        const id = row?.user_id || row?.peer_user_id
        const seen = row?.last_seen_at || row?.peer_last_seen
        if (id && seen && !next[id]) next[id] = seen
      })
      return next
    })
  }, [])

  const isOnline = useCallback((id) => Boolean(id && onlineIds.has(id)), [onlineIds])
  const lastSeenFor = useCallback(
    (id, fallback) => (id && lastSeenMap[id]) || fallback || null,
    [lastSeenMap],
  )

  const value = useMemo(
    () => ({
      onlineIds,
      lastSeenMap,
      isOnline,
      lastSeenFor,
      onlineCount: onlineIds.size,
      seedLastSeen,
    }),
    [onlineIds, lastSeenMap, isOnline, lastSeenFor, seedLastSeen],
  )

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}

const EMPTY_PRESENCE = {
  onlineIds: new Set(),
  lastSeenMap: {},
  isOnline: () => false,
  lastSeenFor: (_id, fallback) => fallback || null,
  onlineCount: 0,
  seedLastSeen: () => {},
}

export function usePresence() {
  return useContext(PresenceContext) || EMPTY_PRESENCE
}

export function usePresenceFor(userId, fallbackLastSeen) {
  const { isOnline, lastSeenFor } = usePresence()
  return {
    online: isOnline(userId),
    lastSeen: lastSeenFor(userId, fallbackLastSeen),
  }
}
