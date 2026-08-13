import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAuth } from '../context/AuthContext'
import { usePresence } from '../context/PresenceContext'
import { useToast } from '../context/ToastContext'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import UserAvatar from '../components/UserAvatar'
import PresenceStatus from '../components/PresenceStatus'
import CensoredText from '../components/CensoredText'
import {
  cancelFriendRequest,
  createCollabPost,
  deactivateCollabPost,
  joinSkillRoom,
  leaveThread,
  listCollabPeers,
  listCollabPosts,
  listFriendRequests,
  listFriends,
  listMyThreads,
  listOpportunisticMembers,
  listThreadPeople,
  loadMessages,
  loadMySkills,
  markThreadRead,
  respondFriendRequest,
  sendFriendRequest,
  sendMessage,
  setOpenToCollab,
  startDm,
  subscribeCollabPosts,
  subscribeThreadMessages,
} from '../lib/collabHub'

gsap.registerPlugin(useGSAP)

const INTENTS = ['collaborate', 'mentor', 'study', 'project', 'other']

function formatWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function threadLabel(thread, t) {
  if (thread?.kind === 'dm') return thread.peer_name || t('hub.dmFallback')
  if (thread?.kind === 'skill') return thread.title || t('hub.skillRoom', { skill: thread.skill_key })
  return thread?.title || t('hub.conversation')
}

function PersonMeta({ headline, country, extra }) {
  const bits = [country, extra].filter(Boolean)
  return (
    <p className="hub-peer-meta">
      {headline ? (
        <>
          <CensoredText text={headline} />
          {bits.length ? ' · ' : null}
        </>
      ) : null}
      {bits.join(' · ')}
    </p>
  )
}

export default function Hub() {
  const { user, profile, refreshProfile } = useAuth()
  const { isOnline, seedLastSeen } = usePresence()
  const toast = useToast()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const root = useRef(null)

  const [tab, setTab] = useState(location.state?.tab || 'people')
  const [open, setOpen] = useState(Boolean(profile?.open_to_collab))
  const [intent, setIntent] = useState(profile?.collab_intent || 'collaborate')
  const [busyOptIn, setBusyOptIn] = useState(false)

  const [people, setPeople] = useState([])
  const [peopleQuery, setPeopleQuery] = useState('')
  const [peers, setPeers] = useState([])
  const [posts, setPosts] = useState([])
  const [threads, setThreads] = useState([])
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [mySkills, setMySkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [peopleById, setPeopleById] = useState({})

  const [activeThreadId, setActiveThreadId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [chatBusy, setChatBusy] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const messagesEnd = useRef(null)

  const [postForm, setPostForm] = useState({
    title: '',
    body: '',
    skills: '',
    intent: 'collaborate',
  })
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    document.title = t('hub.metaTitle')
  }, [t])

  useEffect(() => {
    setOpen(Boolean(profile?.open_to_collab))
    setIntent(profile?.collab_intent || 'collaborate')
  }, [profile?.open_to_collab, profile?.collab_intent])

  const refresh = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [memberRows, peerRows, postRows, threadRows, skills, friendRows, requestRows] = await Promise.all([
        listOpportunisticMembers(),
        listCollabPeers(),
        listCollabPosts(),
        listMyThreads(),
        loadMySkills(user.id),
        listFriends(),
        listFriendRequests(),
      ])
      setPeople(memberRows)
      setPeers(peerRows)
      setPosts(postRows)
      setThreads(threadRows)
      setMySkills(skills)
      setFriends(friendRows)
      setRequests(requestRows)
      seedLastSeen([
        ...memberRows,
        ...peerRows,
        ...friendRows,
        ...requestRows,
        ...threadRows,
      ])
    } catch (err) {
      console.error(err)
      toast.error(err.message || t('common.toast.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [user?.id, toast, t, seedLastSeen])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const refreshPosts = useCallback(async () => {
    try {
      setPosts(await listCollabPosts())
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return undefined
    let timer = null
    const unsub = subscribeCollabPosts(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void refreshPosts(), 120)
    })
    return () => {
      window.clearTimeout(timer)
      unsub()
    }
  }, [user?.id, refreshPosts])

  useGSAP(
    () => {
      gsap.from('.hub-hero, .hub-panel', {
        opacity: 0,
        y: 16,
        duration: 0.45,
        stagger: 0.06,
        ease: 'power2.out',
        clearProps: 'all',
      })
    },
    { scope: root, dependencies: [loading] },
  )

  const activeThread = useMemo(
    () => threads.find((th) => th.thread_id === activeThreadId) || null,
    [threads, activeThreadId],
  )

  const joinedSkillKeys = useMemo(() => {
    const keys = new Set()
    for (const th of threads) {
      if (th.kind === 'skill' && th.skill_key) keys.add(String(th.skill_key).toLowerCase())
    }
    return keys
  }, [threads])

  const onlineMemberCount = useMemo(
    () => people.filter((p) => isOnline(p.user_id)).length,
    [people, isOnline],
  )

  const visiblePeople = useMemo(() => {
    const q = peopleQuery.trim().toLowerCase()
    const rows = q
      ? people.filter((p) =>
          [p.full_name, p.headline, p.country, ...(p.skills || [])].join(' ').toLowerCase().includes(q),
        )
      : people
    return [...rows].sort((a, b) => {
      const ao = isOnline(a.user_id) ? 1 : 0
      const bo = isOnline(b.user_id) ? 1 : 0
      if (ao !== bo) return bo - ao
      const at = new Date(a.last_seen_at || 0).getTime()
      const bt = new Date(b.last_seen_at || 0).getTime()
      return bt - at
    })
  }, [people, peopleQuery, isOnline])

  const openThread = useCallback(
    async (threadId) => {
      if (!threadId) return
      setTab('chats')
      setActiveThreadId(threadId)
      setChatBusy(true)
      try {
        const [rows, people] = await Promise.all([loadMessages(threadId), listThreadPeople(threadId)])
        setMessages(rows)
        const map = {}
        for (const p of people) map[p.user_id] = p
        setPeopleById(map)
        seedLastSeen(people)
        await markThreadRead(threadId)
        setThreads((prev) =>
          prev.map((th) => (th.thread_id === threadId ? { ...th, unread_count: 0 } : th)),
        )
      } catch (err) {
        toast.error(err.message || t('common.toast.genericError'))
      } finally {
        setChatBusy(false)
      }
    },
    [toast, t, seedLastSeen],
  )

  useEffect(() => {
    const incoming = location.state?.openThreadId
    if (!incoming || !user?.id) return
    void openThread(incoming)
    navigate('/hub', { replace: true })
  }, [location.state?.openThreadId, user?.id, openThread, navigate])

  useEffect(() => {
    if (!activeThreadId) return undefined
    const unsub = subscribeThreadMessages(activeThreadId, (row) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) return prev
        return [...prev, row]
      })
      void markThreadRead(activeThreadId)
      if (row.user_id && !peopleById[row.user_id]) {
        void listThreadPeople(activeThreadId).then((people) => {
          const map = {}
          for (const p of people) map[p.user_id] = p
          setPeopleById(map)
        })
      }
    })
    return unsub
  }, [activeThreadId])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages, activeThreadId])

  async function toggleOpenToCollab() {
    if (!user?.id || busyOptIn) return
    setBusyOptIn(true)
    const next = !open
    try {
      await setOpenToCollab(user.id, next, intent)
      setOpen(next)
      await refreshProfile?.()
      toast.success(next ? t('hub.optInOn') : t('hub.optInOff'))
      await refresh()
    } catch (err) {
      toast.error(err.message || t('common.toast.genericError'))
    } finally {
      setBusyOptIn(false)
    }
  }

  async function messagePeer(peerUserId) {
    try {
      const threadId = await startDm(peerUserId)
      await refresh()
      await openThread(threadId)
    } catch (err) {
      toast.error(err.message || t('hub.dmError'))
    }
  }

  async function enterSkillRoom(skill) {
    try {
      const threadId = await joinSkillRoom(skill)
      await refresh()
      await openThread(threadId)
    } catch (err) {
      toast.error(err.message || t('common.toast.genericError'))
    }
  }

  async function onSend(e) {
    e.preventDefault()
    if (!activeThreadId || !draft.trim() || sending) return
    setSending(true)
    const text = draft.trim()
    setDraft('')
    try {
      const row = await sendMessage(activeThreadId, text)
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
      setThreads((prev) =>
        prev.map((th) =>
          th.thread_id === activeThreadId
            ? { ...th, last_body: row.body, last_at: row.created_at }
            : th,
        ),
      )
    } catch (err) {
      setDraft(text)
      toast.error(err.message || t('common.toast.genericError'))
    } finally {
      setSending(false)
    }
  }

  async function onCreatePost(e) {
    e.preventDefault()
    if (posting) return
    if (!postForm.title.trim() || !postForm.body.trim()) {
      toast.info(t('hub.postRequired'))
      return
    }
    setPosting(true)
    try {
      if (!open) {
        await setOpenToCollab(user.id, true, intent)
        setOpen(true)
        await refreshProfile?.()
      }
      await createCollabPost(postForm)
      setPostForm({ title: '', body: '', skills: '', intent: 'collaborate' })
      toast.success(t('hub.postCreated'))
      await refresh()
      setTab('board')
    } catch (err) {
      toast.error(err.message || t('common.toast.genericError'))
    } finally {
      setPosting(false)
    }
  }

  async function onAddFriend(userId) {
    try {
      await sendFriendRequest(userId)
      toast.success(t('hub.friendRequested'))
      await refresh()
    } catch (err) {
      toast.error(err.message || t('common.toast.genericError'))
    }
  }

  async function onCancelRequest(userId) {
    try {
      await cancelFriendRequest(userId)
      await refresh()
    } catch (err) {
      toast.error(err.message || t('common.toast.genericError'))
    }
  }

  async function onRespondRequest(userId, accept) {
    try {
      await respondFriendRequest(userId, accept)
      toast.success(accept ? t('hub.friendAccepted') : t('hub.friendDeclined'))
      await refresh()
    } catch (err) {
      toast.error(err.message || t('common.toast.genericError'))
    }
  }

  async function onLeaveThread() {
    if (!activeThreadId || leaving) return
    const isRoom = activeThread?.kind === 'skill'
    const ok = await toast.confirm({
      title: isRoom ? t('hub.leaveRoom') : t('hub.deleteChat'),
      message: isRoom ? t('hub.leaveConfirmRoom') : t('hub.leaveConfirmDm'),
      confirmLabel: isRoom ? t('hub.leaveRoom') : t('hub.deleteChat'),
      danger: !isRoom,
    })
    if (!ok) return
    setLeaving(true)
    try {
      await leaveThread(activeThreadId)
      setThreads((prev) => prev.filter((th) => th.thread_id !== activeThreadId))
      setActiveThreadId(null)
      setMessages([])
      toast.success(isRoom ? t('hub.leftRoom') : t('hub.deletedChat'))
    } catch (err) {
      toast.error(err.message || t('hub.leaveError'))
    } finally {
      setLeaving(false)
    }
  }

  async function onClosePost(postId) {
    try {
      await deactivateCollabPost(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      toast.success(t('hub.postClosed'))
    } catch (err) {
      toast.error(err.message || t('common.toast.genericError'))
    }
  }

  return (
    <div className="page hub-page" ref={root}>
      <SiteHeader />
      <main className="container hub-main">
        <section className="hub-hero glass-panel">
          <div className="hub-hero-copy">
            <p className="eyebrow">{t('hub.eyebrow')}</p>
            <h1>{t('hub.title')}</h1>
            <p className="muted">{t('hub.lede')}</p>
            <div className="hub-optin">
              <label className="hub-toggle">
                <input
                  type="checkbox"
                  checked={open}
                  disabled={busyOptIn}
                  onChange={() => void toggleOpenToCollab()}
                />
                <span>{t('hub.optInLabel')}</span>
              </label>
              {open ? (
                <select
                  className="hub-intent-select"
                  value={intent}
                  aria-label={t('hub.intentLabel')}
                  onChange={async (e) => {
                    const next = e.target.value
                    setIntent(next)
                    try {
                      await setOpenToCollab(user.id, true, next)
                      await refreshProfile?.()
                    } catch (err) {
                      toast.error(err.message || t('common.toast.genericError'))
                    }
                  }}
                >
                  {INTENTS.map((key) => (
                    <option key={key} value={key}>
                      {t(`hub.intent.${key}`)}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
            {!mySkills.length ? (
              <p className="hub-hint">
                {t('hub.noSkills')}{' '}
                <Link to="/profile">{t('hub.updateProfile')}</Link>
              </p>
            ) : null}
          </div>
          <div className="hub-hero-side">
            <div className="hub-stat">
              <strong>{people.length}</strong>
              <span>{t('hub.statPeople')}</span>
            </div>
            <div className="hub-stat">
              <strong>{onlineMemberCount}</strong>
              <span>{t('hub.statOnline')}</span>
            </div>
            <div className="hub-stat">
              <strong>{threads.reduce((n, th) => n + Number(th.unread_count || 0), 0)}</strong>
              <span>{t('hub.statUnread')}</span>
            </div>
          </div>
        </section>

        <div className="segmented hub-tabs" role="tablist">
          <button type="button" className={tab === 'people' ? 'active' : ''} onClick={() => setTab('people')}>
            {t('hub.tabPeople')}
            {people.length ? ` (${people.length})` : ''}
          </button>
          <button type="button" className={tab === 'peers' ? 'active' : ''} onClick={() => setTab('peers')}>
            {t('hub.tabPeers')}
          </button>
          <button type="button" className={tab === 'friends' ? 'active' : ''} onClick={() => setTab('friends')}>
            {t('hub.tabFriends')}
            {requests.length ? ` (${requests.length})` : ''}
          </button>
          <button type="button" className={tab === 'board' ? 'active' : ''} onClick={() => setTab('board')}>
            {t('hub.tabBoard')}
            {posts.length ? ` (${posts.length})` : ''}
          </button>
          <button type="button" className={tab === 'chats' ? 'active' : ''} onClick={() => setTab('chats')}>
            {t('hub.tabChats')}
          </button>
        </div>

        {loading ? <p className="muted hub-loading">{t('common.loading')}</p> : null}

        {!loading && tab === 'people' ? (
          <section className="hub-panel glass-panel">
            <div className="hub-panel-head">
              <h2>{t('hub.peopleTitle')}</h2>
              <p>{t('hub.peopleHint')}</p>
            </div>
            <label className="hub-people-search">
              <input
                value={peopleQuery}
                onChange={(e) => setPeopleQuery(e.target.value)}
                placeholder={t('hub.peopleSearchPh')}
                aria-label={t('hub.peopleSearch')}
              />
            </label>
            {!visiblePeople.length ? (
              <p className="muted">{people.length ? t('hub.peopleSearchEmpty') : t('hub.peopleEmpty')}</p>
            ) : (
              <ul className="hub-peer-list">
                {visiblePeople.map((person) => (
                  <li key={person.user_id} className="hub-peer">
                    <div className="hub-peer-main">
                      <Link to={`/hub/u/${person.user_id}`} className="hub-person-link">
                        <UserAvatar
                          url={person.avatar_url}
                          name={person.full_name}
                          size={44}
                          showPresence
                          presenceUserId={person.user_id}
                          lastSeenAt={person.last_seen_at}
                        />
                      </Link>
                      <div>
                        <Link to={`/hub/u/${person.user_id}`} className="hub-person-name">
                          <strong>
                            <CensoredText text={person.full_name} />
                          </strong>
                        </Link>
                        <PresenceStatus userId={person.user_id} lastSeenAt={person.last_seen_at} />
                        <PersonMeta
                          headline={person.headline}
                          country={person.country}
                          extra={person.collab_intent ? t(`hub.intent.${person.collab_intent}`) : ''}
                        />
                        {person.skills?.length ? (
                          <div className="hub-shared">
                            {person.skills.slice(0, 6).map((s) => (
                              <span key={s} className="profile-chip">
                                <CensoredText text={s} />
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="hub-peer-actions">
                      <Link className="btn btn-ghost btn-sm" to={`/hub/u/${person.user_id}`}>
                        {t('hub.viewProfile')}
                      </Link>
                      {person.friendship === 'none' ? (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void onAddFriend(person.user_id)}>
                          {t('hub.addFriend')}
                        </button>
                      ) : null}
                      {person.friendship === 'outgoing' ? (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void onCancelRequest(person.user_id)}>
                          {t('hub.cancelRequest')}
                        </button>
                      ) : null}
                      {person.friendship === 'incoming' ? (
                        <>
                          <button type="button" className="btn btn-sm" onClick={() => void onRespondRequest(person.user_id, true)}>
                            {t('hub.acceptFriend')}
                          </button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void onRespondRequest(person.user_id, false)}>
                            {t('hub.declineFriend')}
                          </button>
                        </>
                      ) : null}
                      <button type="button" className="btn btn-sm" onClick={() => void messagePeer(person.user_id)}>
                        {t('hub.message')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {!loading && tab === 'peers' ? (
          <section className="hub-panel glass-panel">
            <div className="hub-panel-head">
              <h2>{t('hub.peersTitle')}</h2>
              <p>{t('hub.peersHint')}</p>
            </div>

            {mySkills.length ? (
              <div className="hub-skill-rooms">
                <p className="hub-skill-rooms-label">{t('hub.skillRooms')}</p>
                <p className="hub-skill-rooms-hint">{t('hub.skillRoomsHint')}</p>
                <div className="hub-skill-chips">
                  {mySkills.slice(0, 10).map((skill) => {
                    const joined = joinedSkillKeys.has(String(skill).toLowerCase())
                    return (
                      <button
                        key={skill}
                        type="button"
                        className={`chip${joined ? ' active' : ''}`}
                        onClick={() => void enterSkillRoom(skill)}
                      >
                        <CensoredText text={joined ? t('hub.openSkill', { skill }) : t('hub.joinSkill', { skill })} />
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {!peers.length ? (
              <p className="muted">{t('hub.peersEmpty')}</p>
            ) : (
              <ul className="hub-peer-list">
                {peers.map((peer) => (
                  <li key={peer.user_id} className="hub-peer">
                    <div className="hub-peer-main">
                      <Link to={`/hub/u/${peer.user_id}`} className="hub-person-link">
                        <UserAvatar
                          url={peer.avatar_url}
                          name={peer.full_name}
                          size={44}
                          showPresence
                          presenceUserId={peer.user_id}
                          lastSeenAt={peer.last_seen_at}
                        />
                      </Link>
                      <div>
                        <Link to={`/hub/u/${peer.user_id}`} className="hub-person-name">
                          <strong>
                            <CensoredText text={peer.full_name} />
                          </strong>
                        </Link>
                        <PresenceStatus userId={peer.user_id} lastSeenAt={peer.last_seen_at} />
                        <PersonMeta
                          headline={peer.headline}
                          country={peer.country}
                          extra={peer.collab_intent ? t(`hub.intent.${peer.collab_intent}`) : ''}
                        />
                        {peer.shared_skills?.length ? (
                          <div className="hub-shared">
                            {peer.shared_skills.slice(0, 6).map((s) => (
                              <span key={s} className="profile-chip">
                                <CensoredText text={s} />
                              </span>
                            ))}
                            <span className="hub-overlap">
                              {t('hub.overlap', { count: peer.overlap_count })}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="hub-peer-actions">
                      <Link className="btn btn-ghost btn-sm" to={`/hub/u/${peer.user_id}`}>
                        {t('hub.viewProfile')}
                      </Link>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => void onAddFriend(peer.user_id)}>
                        {t('hub.addFriend')}
                      </button>
                      <button type="button" className="btn btn-sm" onClick={() => void messagePeer(peer.user_id)}>
                        {t('hub.message')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {!loading && tab === 'friends' ? (
          <section className="hub-panel glass-panel">
            <div className="hub-panel-head">
              <h2>{t('hub.friendsTitle')}</h2>
              <p>{t('hub.friendsHint')}</p>
            </div>
            {requests.length ? (
              <div className="hub-requests">
                <p className="hub-skill-rooms-label">{t('hub.friendRequests')}</p>
                <ul className="hub-peer-list">
                  {requests.map((req) => (
                    <li key={req.user_id} className="hub-peer">
                      <div className="hub-peer-main">
                        <Link to={`/hub/u/${req.user_id}`} className="hub-person-link">
                          <UserAvatar
                            url={req.avatar_url}
                            name={req.full_name}
                            size={44}
                            showPresence
                            presenceUserId={req.user_id}
                            lastSeenAt={req.last_seen_at}
                          />
                        </Link>
                        <div>
                          <Link to={`/hub/u/${req.user_id}`} className="hub-person-name">
                            <strong>
                              <CensoredText text={req.full_name} />
                            </strong>
                          </Link>
                          <PresenceStatus userId={req.user_id} lastSeenAt={req.last_seen_at} />
                          <PersonMeta headline={req.headline} country={req.country} />
                        </div>
                      </div>
                      <div className="hub-peer-actions">
                        <button type="button" className="btn btn-sm" onClick={() => void onRespondRequest(req.user_id, true)}>
                          {t('hub.acceptFriend')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => void onRespondRequest(req.user_id, false)}
                        >
                          {t('hub.declineFriend')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {!friends.length ? (
              <p className="muted">{t('hub.friendsEmpty')}</p>
            ) : (
              <ul className="hub-peer-list">
                {friends.map((friend) => (
                  <li key={friend.user_id} className="hub-peer">
                    <div className="hub-peer-main">
                      <Link to={`/hub/u/${friend.user_id}`} className="hub-person-link">
                        <UserAvatar
                          url={friend.avatar_url}
                          name={friend.full_name}
                          size={44}
                          showPresence
                          presenceUserId={friend.user_id}
                          lastSeenAt={friend.last_seen_at}
                        />
                      </Link>
                      <div>
                        <Link to={`/hub/u/${friend.user_id}`} className="hub-person-name">
                          <strong>
                            <CensoredText text={friend.full_name} />
                          </strong>
                        </Link>
                        <PresenceStatus userId={friend.user_id} lastSeenAt={friend.last_seen_at} />
                        <PersonMeta headline={friend.headline} country={friend.country} />
                      </div>
                    </div>
                    <div className="hub-peer-actions">
                      <Link className="btn btn-ghost btn-sm" to={`/hub/u/${friend.user_id}`}>
                        {t('hub.viewProfile')}
                      </Link>
                      <button type="button" className="btn btn-sm" onClick={() => void messagePeer(friend.user_id)}>
                        {t('hub.message')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {!loading && tab === 'board' ? (
          <section className="hub-board">
            <form className="hub-panel glass-panel hub-post-form" onSubmit={onCreatePost}>
              <div className="hub-panel-head">
                <h2>{t('hub.postTitle')}</h2>
                <p>{t('hub.postHint')}</p>
              </div>
              <label className="profile-field">
                <span>{t('hub.postHeadline')}</span>
                <input
                  value={postForm.title}
                  onChange={(e) => setPostForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={t('hub.postHeadlinePh')}
                  maxLength={120}
                  required
                />
              </label>
              <label className="profile-field">
                <span>{t('hub.postBody')}</span>
                <textarea
                  rows={4}
                  value={postForm.body}
                  onChange={(e) => setPostForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder={t('hub.postBodyPh')}
                  maxLength={2000}
                  required
                />
              </label>
              <div className="hub-post-row">
                <label className="profile-field">
                  <span>{t('hub.postSkills')}</span>
                  <input
                    value={postForm.skills}
                    onChange={(e) => setPostForm((f) => ({ ...f, skills: e.target.value }))}
                    placeholder={t('hub.postSkillsPh')}
                  />
                </label>
                <label className="profile-field">
                  <span>{t('hub.intentLabel')}</span>
                  <select
                    value={postForm.intent}
                    onChange={(e) => setPostForm((f) => ({ ...f, intent: e.target.value }))}
                  >
                    {INTENTS.map((key) => (
                      <option key={key} value={key}>
                        {t(`hub.intent.${key}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button type="submit" className="btn" disabled={posting}>
                {posting ? t('hub.posting') : t('hub.postSubmit')}
              </button>
            </form>

            <div className="hub-panel glass-panel">
              <div className="hub-panel-head">
                <h2>{t('hub.boardTitle')}</h2>
                <p>{t('hub.boardHint')}</p>
              </div>
              {!posts.length ? (
                <p className="muted">{t('hub.boardEmpty')}</p>
              ) : (
                <ul className="hub-post-list">
                  {posts.map((post) => (
                    <li key={post.id} className="hub-post">
                      <div className="hub-post-top">
                        <div className="hub-post-author">
                          <Link to={`/hub/u/${post.user_id}`} className="hub-person-link">
                            <UserAvatar
                              url={post.author_avatar}
                              name={post.author_name}
                              size={44}
                              showPresence
                              presenceUserId={post.user_id}
                            />
                          </Link>
                          <div>
                            <strong>
                              <CensoredText text={post.title} />
                            </strong>
                            <p className="hub-peer-meta">
                              <Link to={`/hub/u/${post.user_id}`} className="hub-person-name">
                                <CensoredText text={post.author_name} />
                              </Link>
                              {post.author_country ? ` · ${post.author_country}` : ''}
                              {` · ${t(`hub.intent.${post.intent}`)}`}
                              {` · ${formatWhen(post.created_at)}`}
                            </p>
                          </div>
                        </div>
                        {post.user_id === user?.id ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => void onClosePost(post.id)}
                          >
                            {t('hub.closePost')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => void messagePeer(post.user_id)}
                          >
                            {t('hub.reply')}
                          </button>
                        )}
                      </div>
                      <p>
                        <CensoredText text={post.body} />
                      </p>
                      {post.skills?.length ? (
                        <div className="hub-shared">
                          {post.skills.map((s) => (
                            <span key={s} className="profile-chip">
                              <CensoredText text={s} />
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : null}

        {!loading && tab === 'chats' ? (
          <section className="hub-chat glass-panel">
            <aside className="hub-thread-list" aria-label={t('hub.tabChats')}>
              {!threads.length ? (
                <p className="muted hub-chat-empty">{t('hub.chatsEmpty')}</p>
              ) : (
                threads.map((th) => (
                  <button
                    key={th.thread_id}
                    type="button"
                    className={`hub-thread ${th.thread_id === activeThreadId ? 'active' : ''}`}
                    onClick={() => void openThread(th.thread_id)}
                  >
                    <UserAvatar
                      url={th.kind === 'dm' ? th.peer_avatar : null}
                      name={th.kind === 'dm' ? th.peer_name : threadLabel(th, t)}
                      size={44}
                      showPresence={th.kind === 'dm'}
                      presenceUserId={th.peer_user_id}
                      lastSeenAt={th.peer_last_seen}
                    />
                    <span className="hub-thread-copy">
                      <span className="hub-thread-title">
                        <CensoredText text={threadLabel(th, t)} />
                      </span>
                      <span className="hub-thread-preview">
                        {th.last_body ? <CensoredText text={th.last_body} /> : t('hub.noMessagesYet')}
                      </span>
                    </span>
                    <span className="hub-thread-meta">
                      {formatWhen(th.last_at)}
                      {Number(th.unread_count) > 0 ? (
                        <em className="hub-unread">{th.unread_count}</em>
                      ) : null}
                    </span>
                  </button>
                ))
              )}
            </aside>

            <div className="hub-chat-pane">
              {!activeThreadId ? (
                <p className="muted hub-chat-empty">{t('hub.pickChat')}</p>
              ) : (
                <>
                  <header className="hub-chat-head">
                    <div className="hub-chat-head-person">
                      {activeThread?.kind === 'dm' && activeThread.peer_user_id ? (
                        <Link to={`/hub/u/${activeThread.peer_user_id}`} className="hub-person-link">
                          <UserAvatar
                            url={activeThread.peer_avatar}
                            name={activeThread.peer_name}
                            size={40}
                            showPresence
                            presenceUserId={activeThread.peer_user_id}
                            lastSeenAt={activeThread.peer_last_seen}
                          />
                        </Link>
                      ) : (
                        <UserAvatar name={threadLabel(activeThread, t)} size={40} />
                      )}
                      <div className="hub-chat-head-copy">
                        {activeThread?.kind === 'dm' && activeThread.peer_user_id ? (
                          <Link to={`/hub/u/${activeThread.peer_user_id}`} className="hub-person-name">
                            <strong>
                              <CensoredText text={threadLabel(activeThread, t)} />
                            </strong>
                          </Link>
                        ) : (
                          <strong>
                            <CensoredText text={threadLabel(activeThread, t)} />
                          </strong>
                        )}
                        {activeThread?.kind === 'dm' && activeThread.peer_user_id ? (
                          <PresenceStatus userId={activeThread.peer_user_id} lastSeenAt={activeThread.peer_last_seen} />
                        ) : (
                          <span className="muted">{t('hub.skillRoomLive')}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={leaving}
                      onClick={() => void onLeaveThread()}
                    >
                      {activeThread?.kind === 'skill' ? t('hub.leaveRoom') : t('hub.deleteChat')}
                    </button>
                  </header>
                  <div className="hub-messages" role="log" aria-live="polite">
                    {chatBusy ? <p className="muted">{t('common.loading')}</p> : null}
                    {!chatBusy && !messages.length ? <p className="muted">{t('hub.noMessagesYet')}</p> : null}
                    {messages.map((m) => {
                      const mine = m.user_id === user?.id
                      const person = peopleById[m.user_id]
                      const showName = !mine && activeThread?.kind === 'skill'
                      return (
                        <div key={m.id} className={`hub-msg-row ${mine ? 'mine' : 'theirs'}`}>
                          {!mine ? (
                            person?.user_id ? (
                              <Link to={`/hub/u/${person.user_id}`} className="hub-person-link">
                                <UserAvatar
                                  url={person.avatar_url}
                                  name={person.full_name}
                                  size={32}
                                  showPresence
                                  presenceUserId={person.user_id}
                                  lastSeenAt={person.last_seen_at}
                                />
                              </Link>
                            ) : (
                              <UserAvatar url={activeThread?.peer_avatar} name={activeThread?.peer_name} size={32} />
                            )
                          ) : null}
                          <div className={`hub-msg ${mine ? 'mine' : 'theirs'}`}>
                            {showName ? (
                              <span className="hub-msg-name">
                                <CensoredText text={person?.full_name || t('hub.dmFallback')} />
                              </span>
                            ) : null}
                            <p>
                              <CensoredText text={m.body} />
                            </p>
                            <time>{formatWhen(m.created_at)}</time>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEnd} />
                  </div>
                  <form className="hub-composer" onSubmit={onSend}>
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={t('hub.messagePh')}
                      maxLength={4000}
                      aria-label={t('hub.messagePh')}
                    />
                    <button type="submit" className="btn" disabled={sending || !draft.trim()}>
                      {t('hub.send')}
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}
