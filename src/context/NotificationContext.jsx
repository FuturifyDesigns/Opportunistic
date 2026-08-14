import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import {
  dismissMatchRecommendation,
  markNotificationsRead,
  listFriendFitProfiles,
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
  const [fitFriends, setFitFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [recs, setRecs] = useState([])
  const [unreadThreads, setUnreadThreads] = useState([])
  const readyRef = useRef(false)
  const activeChatThreadRef = useRef(null)

  const setActiveChatThread = useCallback((threadId) => {
    activeChatThreadRef.current = threadId || null
  }, [])

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setFriends([])
      setFitFriends([])
      setRequests([])
      setRecs([])
      setUnreadThreads([])
      return
    }
    try {
      const [friendRows, fitRows, requestRows, recRows, threads] = await Promise.all([
        listFriends().catch(() => []),
        listFriendFitProfiles().catch(() => []),
        listFriendRequests().catch(() => []),
        listMatchRecommendations().catch(() => []),
        listMyThreads().catch(() => []),
      ])
      setFriends(friendRows)
      setFitFriends(fitRows)
      setRequests(requestRows)
      setRecs(recRows)
      setUnreadThreads(
        (threads || [])
          .filter((th) => Number(th.unread_count || 0) > 0)
          .sort((a, b) => new Date(b.last_at || 0) - new Date(a.last_at || 0)),
      )
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
          const row = payload.new || {}
          if (!row.user_id || row.user_id === user.id) return
          bump()
          if (!readyRef.current) return
          if (row.thread_id && row.thread_id === activeChatThreadRef.current) return
          const preview = String(row.body || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80)
          toast.info(preview ? t('notify.messageToast', { preview }) : t('notify.messageToastPlain'))
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

  const unseenRecs = useMemo(() => recs.filter((r) => !r.seen_at), [recs])

  const markAllRead = useCallback(async () => {
    await markNotificationsRead()
    setRecs((list) => list.map((r) => (r.seen_at ? r : { ...r, seen_at: new Date().toISOString() })))
    setUnreadThreads([])
  }, [])

  const unread = useMemo(
    () => unreadThreads.reduce((n, th) => n + Number(th.unread_count || 0), 0),
    [unreadThreads],
  )

  const value = useMemo(
    () => ({
      friends,
      fitFriends,
      friendCount: friends.length,
      requests,
      recs,
      unseenRecs,
      unread,
      unreadThreads,
      count: requests.length + unseenRecs.length + unreadThreads.length,
      refresh,
      acceptRequest,
      declineRequest,
      dismissRec,
      markAllRead,
      setActiveChatThread,
    }),
    [
      friends,
      fitFriends,
      requests,
      recs,
      unseenRecs,
      unread,
      unreadThreads,
      refresh,
      acceptRequest,
      declineRequest,
      dismissRec,
      markAllRead,
      setActiveChatThread,
    ],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

const EMPTY = {
  friends: [],
  fitFriends: [],
  friendCount: 0,
  requests: [],
  recs: [],
  unseenRecs: [],
  unread: 0,
  unreadThreads: [],
  count: 0,
  refresh: async () => {},
  acceptRequest: async () => {},
  declineRequest: async () => {},
  dismissRec: async () => {},
  markAllRead: async () => {},
  setActiveChatThread: () => {},
}

export function useNotifications() {
  return useContext(NotificationContext) || EMPTY
}
