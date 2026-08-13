import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import {
  dismissMatchRecommendation,
  listFriendRequests,
  listFriends,
  listMatchRecommendations,
  listMyThreads,
  respondFriendRequest,
} from '../lib/collabHub'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const toast = useToast()
  const { t } = useTranslation()
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [recs, setRecs] = useState([])
  const [unread, setUnread] = useState(0)
  const readyRef = useRef(false)

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setFriends([])
      setRequests([])
      setRecs([])
      setUnread(0)
      return
    }
    try {
      const [friendRows, requestRows, recRows, threads] = await Promise.all([
        listFriends().catch(() => []),
        listFriendRequests().catch(() => []),
        listMatchRecommendations().catch(() => []),
        listMyThreads().catch(() => []),
      ])
      setFriends(friendRows)
      setRequests(requestRows)
      setRecs(recRows)
      setUnread(threads.reduce((n, th) => n + Number(th.unread_count || 0), 0))
    } catch {
      /* ignore */
    }
  }, [user?.id])

  useEffect(() => {
    readyRef.current = false
    void refresh().finally(() => {
      readyRef.current = true
    })
  }, [refresh])

  useEffect(() => {
    if (!user?.id) return undefined
    let timer = null
    const bump = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void refresh(), 160)
    }

    const channel = supabase
      .channel(`opp-notify-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'collab_friendships' },
        (payload) => {
          const row = payload.new || payload.old || {}
          bump()
          if (!readyRef.current) return
          if (payload.eventType === 'INSERT' && row.addressee_id === user.id && row.status === 'pending') {
            toast.info(t('notify.friendToast'))
          }
          if (payload.eventType === 'UPDATE' && row.status === 'accepted' && row.requester_id === user.id) {
            toast.success(t('notify.acceptedToast'))
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_recommendations' },
        (payload) => {
          const row = payload.new || payload.old || {}
          bump()
          if (!readyRef.current) return
          if (payload.eventType === 'INSERT' && row.to_user === user.id) {
            toast.info(t('notify.recToast'))
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'collab_messages' },
        (payload) => {
          if (payload.new?.user_id && payload.new.user_id !== user.id) bump()
        },
      )
      .subscribe()

    return () => {
      window.clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [user?.id, refresh, toast, t])

  const acceptRequest = useCallback(
    async (userId) => {
      await respondFriendRequest(userId, true)
      await refresh()
    },
    [refresh],
  )

  const declineRequest = useCallback(
    async (userId) => {
      await respondFriendRequest(userId, false)
      await refresh()
    },
    [refresh],
  )

  const dismissRec = useCallback(
    async (id) => {
      await dismissMatchRecommendation(id)
      setRecs((list) => list.filter((r) => r.id !== id))
    },
    [],
  )

  const value = useMemo(
    () => ({
      friends,
      friendCount: friends.length,
      requests,
      recs,
      unread,
      count: requests.length + recs.length + (unread > 0 ? 1 : 0),
      refresh,
      acceptRequest,
      declineRequest,
      dismissRec,
    }),
    [friends, requests, recs, unread, refresh, acceptRequest, declineRequest, dismissRec],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

const EMPTY = {
  friends: [],
  friendCount: 0,
  requests: [],
  recs: [],
  unread: 0,
  count: 0,
  refresh: async () => {},
  acceptRequest: async () => {},
  declineRequest: async () => {},
  dismissRec: async () => {},
}

export function useNotifications() {
  return useContext(NotificationContext) || EMPTY
}
