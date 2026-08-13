import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import UserAvatar from '../components/UserAvatar'
import CensoredText from '../components/CensoredText'
import {
  cancelFriendRequest,
  getCollabProfile,
  respondFriendRequest,
  sendFriendRequest,
  startDm,
  unfriend,
} from '../lib/collabHub'

export default function Member() {
  const { userId } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [person, setPerson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = t('hub.memberMetaTitle')
  }, [t])

  useEffect(() => {
    if (userId && user?.id && userId === user.id) {
      navigate('/profile', { replace: true })
    }
  }, [userId, user?.id, navigate])

  useEffect(() => {
    let live = true
    async function load() {
      if (!userId || userId === user?.id) return
      setLoading(true)
      try {
        const row = await getCollabProfile(userId)
        if (live) setPerson(row)
      } catch (err) {
        if (live) {
          setPerson(null)
          toast.error(err.message || t('hub.memberLoadError'))
        }
      } finally {
        if (live) setLoading(false)
      }
    }
    void load()
    return () => {
      live = false
    }
  }, [userId, user?.id, toast, t])

  async function onFriendAction(kind) {
    if (!userId || busy) return
    if (
      kind === 'unfriend' &&
      !(await toast.confirm({
        title: t('hub.unfriend'),
        message: t('hub.unfriendConfirm'),
        confirmLabel: t('hub.unfriend'),
        danger: true,
      }))
    ) {
      return
    }
    setBusy(true)
    try {
      let next = person?.friendship
      if (kind === 'add') next = await sendFriendRequest(userId)
      if (kind === 'accept') next = await respondFriendRequest(userId, true)
      if (kind === 'decline') next = await respondFriendRequest(userId, false)
      if (kind === 'cancel') next = await cancelFriendRequest(userId)
      if (kind === 'unfriend') next = await unfriend(userId)
      setPerson((p) => (p ? { ...p, friendship: next } : p))
      if (kind === 'add') toast.success(t('hub.friendRequested'))
      if (kind === 'accept') toast.success(t('hub.friendAccepted'))
      if (kind === 'unfriend') toast.success(t('hub.unfriended'))
    } catch (err) {
      toast.error(err.message || t('common.toast.genericError'))
    } finally {
      setBusy(false)
    }
  }

  async function onMessage() {
    if (!userId || busy) return
    setBusy(true)
    try {
      const threadId = await startDm(userId)
      navigate('/hub', { state: { openThreadId: threadId, tab: 'chats' } })
    } catch (err) {
      toast.error(err.message || t('hub.dmError'))
    } finally {
      setBusy(false)
    }
  }

  const rel = person?.friendship

  return (
    <div className="page hub-page">
      <SiteHeader />
      <main className="container hub-main">
        <p className="hub-hint">
          <Link to="/hub">{t('hub.backHub')}</Link>
        </p>
        {loading ? <p className="muted">{t('common.loading')}</p> : null}
        {!loading && !person ? (
          <section className="hub-panel glass-panel">
            <h1>{t('hub.memberMissing')}</h1>
            <p className="muted">{t('hub.memberMissingBody')}</p>
          </section>
        ) : null}
        {!loading && person ? (
          <section className="hub-panel glass-panel member-card">
            <div className="member-identity">
              <UserAvatar url={person.avatar_url} name={person.full_name} size={88} />
              <div>
                <p className="eyebrow">{t('hub.memberEyebrow')}</p>
                <h1>
                  <CensoredText text={person.full_name} />
                </h1>
                <p className="muted">
                  {person.headline ? <CensoredText text={person.headline} /> : t('hub.memberNoHeadline')}
                </p>
                <div className="hub-shared">
                  {person.country ? <span className="profile-chip">{person.country}</span> : null}
                  {person.collab_intent ? (
                    <span className="profile-chip">{t(`hub.intent.${person.collab_intent}`)}</span>
                  ) : null}
                </div>
              </div>
            </div>
            {person.bio ? (
              <p className="member-bio">
                <CensoredText text={person.bio} />
              </p>
            ) : null}
            {person.skills?.length ? (
              <div className="hub-shared">
                {person.skills.map((s) => (
                  <span key={s} className="profile-chip">
                    <CensoredText text={s} />
                  </span>
                ))}
              </div>
            ) : null}
            <div className="member-actions">
              <button type="button" className="btn" disabled={busy} onClick={() => void onMessage()}>
                {t('hub.message')}
              </button>
              {rel === 'none' ? (
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void onFriendAction('add')}>
                  {t('hub.addFriend')}
                </button>
              ) : null}
              {rel === 'outgoing' ? (
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void onFriendAction('cancel')}>
                  {t('hub.cancelRequest')}
                </button>
              ) : null}
              {rel === 'incoming' ? (
                <>
                  <button type="button" className="btn" disabled={busy} onClick={() => void onFriendAction('accept')}>
                    {t('hub.acceptFriend')}
                  </button>
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void onFriendAction('decline')}>
                    {t('hub.declineFriend')}
                  </button>
                </>
              ) : null}
              {rel === 'friends' ? (
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void onFriendAction('unfriend')}>
                  {t('hub.unfriend')}
                </button>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}
