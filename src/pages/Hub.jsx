import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import {
  createCollabPost,
  deactivateCollabPost,
  joinSkillRoom,
  listCollabPeers,
  listCollabPosts,
  listMyThreads,
  loadMessages,
  loadMySkills,
  markThreadRead,
  sendMessage,
  setOpenToCollab,
  startDm,
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

export default function Hub() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const { t } = useTranslation()
  const root = useRef(null)

  const [tab, setTab] = useState('peers')
  const [open, setOpen] = useState(Boolean(profile?.open_to_collab))
  const [intent, setIntent] = useState(profile?.collab_intent || 'collaborate')
  const [busyOptIn, setBusyOptIn] = useState(false)

  const [peers, setPeers] = useState([])
  const [posts, setPosts] = useState([])
  const [threads, setThreads] = useState([])
  const [mySkills, setMySkills] = useState([])
  const [loading, setLoading] = useState(true)

  const [activeThreadId, setActiveThreadId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [chatBusy, setChatBusy] = useState(false)
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
      const [peerRows, postRows, threadRows, skills] = await Promise.all([
        listCollabPeers(),
        listCollabPosts(),
        listMyThreads(),
        loadMySkills(user.id),
      ])
      setPeers(peerRows)
      setPosts(postRows)
      setThreads(threadRows)
      setMySkills(skills)
    } catch (err) {
      console.error(err)
      toast.error(err.message || t('common.toast.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [user?.id, toast, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

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

  const openThread = useCallback(
    async (threadId) => {
      if (!threadId) return
      setTab('chats')
      setActiveThreadId(threadId)
      setChatBusy(true)
      try {
        const rows = await loadMessages(threadId)
        setMessages(rows)
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
    [toast, t],
  )

  useEffect(() => {
    if (!activeThreadId) return undefined
    const unsub = subscribeThreadMessages(activeThreadId, (row) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) return prev
        return [...prev, row]
      })
      void markThreadRead(activeThreadId)
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
      await refreshProfile?.(user.id, user)
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
      if (!open) {
        toast.info(t('hub.optInFirst'))
        return
      }
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
        await refreshProfile?.(user.id, user)
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
                      await refreshProfile?.(user.id, user)
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
              <strong>{peers.length}</strong>
              <span>{t('hub.statPeers')}</span>
            </div>
            <div className="hub-stat">
              <strong>{posts.length}</strong>
              <span>{t('hub.statPosts')}</span>
            </div>
            <div className="hub-stat">
              <strong>{threads.reduce((n, th) => n + Number(th.unread_count || 0), 0)}</strong>
              <span>{t('hub.statUnread')}</span>
            </div>
          </div>
        </section>

        <div className="segmented hub-tabs" role="tablist">
          <button type="button" className={tab === 'peers' ? 'active' : ''} onClick={() => setTab('peers')}>
            {t('hub.tabPeers')}
          </button>
          <button type="button" className={tab === 'board' ? 'active' : ''} onClick={() => setTab('board')}>
            {t('hub.tabBoard')}
          </button>
          <button type="button" className={tab === 'chats' ? 'active' : ''} onClick={() => setTab('chats')}>
            {t('hub.tabChats')}
          </button>
        </div>

        {loading ? <p className="muted hub-loading">{t('common.loading')}</p> : null}

        {!loading && tab === 'peers' ? (
          <section className="hub-panel glass-panel">
            <div className="hub-panel-head">
              <h2>{t('hub.peersTitle')}</h2>
              <p>{t('hub.peersHint')}</p>
            </div>

            {mySkills.length ? (
              <div className="hub-skill-rooms">
                <p className="hub-skill-rooms-label">{t('hub.skillRooms')}</p>
                <div className="hub-skill-chips">
                  {mySkills.slice(0, 10).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      className="chip"
                      onClick={() => void enterSkillRoom(skill)}
                    >
                      {t('hub.joinSkill', { skill })}
                    </button>
                  ))}
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
                      <div className="hub-peer-avatar" aria-hidden="true">
                        {(peer.full_name || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <strong>{peer.full_name}</strong>
                        <p className="hub-peer-meta">
                          {[peer.headline, peer.country, peer.collab_intent && t(`hub.intent.${peer.collab_intent}`)]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        {peer.shared_skills?.length ? (
                          <div className="hub-shared">
                            {peer.shared_skills.slice(0, 6).map((s) => (
                              <span key={s} className="profile-chip">
                                {s}
                              </span>
                            ))}
                            <span className="hub-overlap">
                              {t('hub.overlap', { count: peer.overlap_count })}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <button type="button" className="btn btn-sm" onClick={() => void messagePeer(peer.user_id)}>
                      {t('hub.message')}
                    </button>
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
                        <div>
                          <strong>{post.title}</strong>
                          <p className="hub-peer-meta">
                            {post.author_name}
                            {post.author_country ? ` · ${post.author_country}` : ''}
                            {` · ${t(`hub.intent.${post.intent}`)}`}
                            {` · ${formatWhen(post.created_at)}`}
                          </p>
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
                      <p>{post.body}</p>
                      {post.skills?.length ? (
                        <div className="hub-shared">
                          {post.skills.map((s) => (
                            <span key={s} className="profile-chip">
                              {s}
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
                    <span className="hub-thread-title">{threadLabel(th, t)}</span>
                    <span className="hub-thread-preview">{th.last_body || t('hub.noMessagesYet')}</span>
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
                    <strong>{threadLabel(activeThread, t)}</strong>
                    <span className="muted">{activeThread?.kind === 'skill' ? t('hub.skillRoomLive') : t('hub.dmLive')}</span>
                  </header>
                  <div className="hub-messages" role="log" aria-live="polite">
                    {chatBusy ? <p className="muted">{t('common.loading')}</p> : null}
                    {!chatBusy && !messages.length ? <p className="muted">{t('hub.noMessagesYet')}</p> : null}
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`hub-msg ${m.user_id === user?.id ? 'mine' : 'theirs'}`}
                      >
                        <p>{m.body}</p>
                        <time>{formatWhen(m.created_at)}</time>
                      </div>
                    ))}
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
