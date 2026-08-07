import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  getLastMatchAt,
  getLastMatchMeta,
  runMatchingForUser,
  shouldWeeklyRefresh,
} from '../lib/matchingService'
import MatchCard from '../components/MatchCard'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

gsap.registerPlugin(useGSAP)

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useState('scholarships')
  const [filter, setFilter] = useState('all') // all | saved | strong
  const [query, setQuery] = useState('')
  const [scholarships, setScholarships] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [engineNote, setEngineNote] = useState('')
  const [lastAt, setLastAt] = useState(null)
  const [meta, setMeta] = useState(null)
  const listRef = useRef(null)
  const autoRan = useRef(false)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const [{ data: s, error: sErr }, { data: j, error: jErr }] = await Promise.all([
        supabase
          .from('scholarship_matches')
          .select('*')
          .eq('user_id', user.id)
          .eq('dismissed', false)
          .or(`deadline.is.null,deadline.gte.${today}`)
          .order('match_score', { ascending: false }),
        supabase
          .from('job_matches')
          .select('*')
          .eq('user_id', user.id)
          .eq('dismissed', false)
          .order('match_score', { ascending: false }),
      ])
      if (sErr) throw sErr
      if (jErr) throw jErr
      setScholarships(s || [])
      setJobs(j || [])
      setLastAt(getLastMatchAt(user.id))
      setMeta(getLastMatchMeta(user.id))
    } catch {
      setScholarships([])
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const refreshEngine = useCallback(
    async (reason = 'manual') => {
      if (!user?.id || refreshing) return
      setRefreshing(true)
      setEngineNote(reason === 'weekly' ? 'Weekly refresh · scanning the web…' : 'Fetching live jobs & country scholarships…')
      try {
        const result = await runMatchingForUser(user.id)
        setEngineNote(
          `Updated · ${result.scholarships} scholarships · ${result.jobs} jobs` +
            (result.meta?.live != null ? ` · ${result.meta.live} live postings` : ''),
        )
        setLastAt(result.refreshedAt)
        setMeta(result.meta || null)
        await refreshProfile?.()
        await load()
      } catch (e) {
        setEngineNote(e.message || 'Refresh failed')
      } finally {
        setRefreshing(false)
      }
    },
    [user?.id, refreshing, load, refreshProfile],
  )

  useEffect(() => {
    document.title = t('dashboard.title')
    load()
  }, [load, t])

  // Auto weekly refresh + empty dashboard bootstrap
  useEffect(() => {
    if (!user?.id || loading || autoRan.current) return
    const empty = scholarships.length === 0 && jobs.length === 0
    if (empty || shouldWeeklyRefresh(user.id)) {
      autoRan.current = true
      refreshEngine(empty ? 'manual' : 'weekly')
    }
  }, [user?.id, loading, scholarships.length, jobs.length, refreshEngine])

  useGSAP(
    () => {
      if (loading || refreshing) return
      gsap.from('.dash-stat', { y: 16, opacity: 0, stagger: 0.06, duration: 0.4, ease: 'power2.out' })
      gsap.from('.match-card', {
        y: 18,
        opacity: 0,
        duration: 0.35,
        stagger: 0.05,
        ease: 'power2.out',
      })
    },
    { scope: listRef, dependencies: [loading, refreshing, tab, filter, scholarships, jobs] },
  )

  async function onSave(match) {
    const table = tab === 'scholarships' ? 'scholarship_matches' : 'job_matches'
    await supabase.from(table).update({ saved: !match.saved }).eq('id', match.id)
    load()
  }

  async function onDismiss(match) {
    const table = tab === 'scholarships' ? 'scholarship_matches' : 'job_matches'
    await supabase.from(table).update({ dismissed: true }).eq('id', match.id)
    load()
  }

  const pool = tab === 'scholarships' ? scholarships : jobs

  const rows = useMemo(() => {
    let list = pool
    if (filter === 'saved') list = list.filter((m) => m.saved)
    if (filter === 'strong') list = list.filter((m) => Number(m.match_score) >= 75)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.source?.toLowerCase().includes(q) ||
          m.company?.toLowerCase().includes(q) ||
          m.reasoning?.toLowerCase().includes(q),
      )
    }
    return list
  }, [pool, filter, query])

  const savedCount = pool.filter((m) => m.saved).length
  const strongCount = pool.filter((m) => Number(m.match_score) >= 75).length
  const avgScore = pool.length
    ? Math.round(pool.reduce((a, m) => a + (Number(m.match_score) || 0), 0) / pool.length)
    : 0

  const lastLabel = lastAt
    ? new Date(lastAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'Never'

  return (
    <div className="page dash-page">
      <SiteHeader />
      <main className="container dashboard" ref={listRef}>
        <section className="dash-hero glass-panel">
          <div className="dash-hero-copy">
            <p className="eyebrow">{t('nav.dashboard')}</p>
            <h1>
              {profile?.full_name
                ? t('dashboard.hello', { name: profile.full_name.split(' ')[0] })
                : t('dashboard.helloGuest')}
            </h1>
            <p className="muted">
              {t('dashboard.lede', { country: profile?.country || '—' })}
            </p>
            <div className="dash-engine">
              <span className={`dash-engine-dot ${refreshing ? 'pulse' : ''}`} />
              <div>
                <strong>Opportunity engine</strong>
                <p>
                  Country · <em>{profile?.country || 'set in profile'}</em>
                  {meta?.live != null ? ` · Last live haul ${meta.live} jobs` : ''}
                  {' · '}Refreshed {lastLabel}
                </p>
                {engineNote ? <p className="dash-engine-note">{engineNote}</p> : null}
              </div>
            </div>
          </div>
          <div className="dash-hero-actions">
            <button
              type="button"
              className="btn"
              disabled={refreshing}
              onClick={() => refreshEngine('manual')}
            >
              {refreshing ? 'Scanning web…' : 'Refresh from web'}
            </button>
            <Link className="btn btn-ghost" to="/profile">
              {t('dashboard.updateProfile')}
            </Link>
          </div>
        </section>

        <section className="dash-stats">
          <article className="dash-stat">
            <p className="dash-stat-label">Scholarships</p>
            <p className="dash-stat-value">{scholarships.length}</p>
            <p className="dash-stat-hint">Eligible for {profile?.country || 'your country'}</p>
          </article>
          <article className="dash-stat">
            <p className="dash-stat-label">Jobs</p>
            <p className="dash-stat-value">{jobs.length}</p>
            <p className="dash-stat-hint">Live feeds + country boards</p>
          </article>
          <article className="dash-stat">
            <p className="dash-stat-label">Avg score</p>
            <p className="dash-stat-value">{avgScore || '—'}%</p>
            <p className="dash-stat-hint">Profile fit across this tab</p>
          </article>
          <article className="dash-stat">
            <p className="dash-stat-label">Saved</p>
            <p className="dash-stat-value">{savedCount}</p>
            <p className="dash-stat-hint">{strongCount} strong matches (≥75%)</p>
          </article>
        </section>

        <div className="dash-toolbar">
          <div className="segmented">
            <button
              type="button"
              className={tab === 'scholarships' ? 'active' : ''}
              onClick={() => setTab('scholarships')}
            >
              {t('dashboard.scholarships', { count: scholarships.length })}
            </button>
            <button type="button" className={tab === 'jobs' ? 'active' : ''} onClick={() => setTab('jobs')}>
              {t('dashboard.jobs', { count: jobs.length })}
            </button>
          </div>

          <div className="dash-filters">
            <button type="button" className={filter === 'all' ? 'chip active' : 'chip'} onClick={() => setFilter('all')}>
              All
            </button>
            <button
              type="button"
              className={filter === 'strong' ? 'chip active' : 'chip'}
              onClick={() => setFilter('strong')}
            >
              Strong
            </button>
            <button
              type="button"
              className={filter === 'saved' ? 'chip active' : 'chip'}
              onClick={() => setFilter('saved')}
            >
              Saved
            </button>
            <input
              className="dash-search"
              type="search"
              placeholder="Filter by title, source, skill…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="dashboard-layout dash-grid">
          <div className="match-list">
            {loading || refreshing ? (
              <div className="dash-loading">
                <div className="spinner" />
                <p>{refreshing ? 'Pulling live jobs & country scholarships…' : t('common.loading')}</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="empty-state glass-panel">
                <h3>{t('dashboard.empty')}</h3>
                <p>{t('dashboard.emptyBody')}</p>
                <div className="cta-row">
                  <button type="button" className="btn" onClick={() => refreshEngine('manual')}>
                    Refresh from web
                  </button>
                  <Link className="btn btn-ghost" to="/profile">
                    {t('dashboard.updateProfile')}
                  </Link>
                </div>
              </div>
            ) : (
              rows.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  kind={tab}
                  onOpen={(m) =>
                    navigate(`/match/${tab === 'scholarships' ? 'scholarship' : 'job'}/${m.id}`)
                  }
                  onSave={onSave}
                  onDismiss={onDismiss}
                />
              ))
            )}
          </div>

          <aside className="dash-side glass-panel">
            <p className="jarvis-caption">How matching works</p>
            <h2>Profile → web → ranked cards</h2>
            <ul className="dash-side-list">
              <li>
                <strong>Scholarships</strong>
                <span>Only programs that accept applicants from {profile?.country || 'your country'} / region.</span>
              </li>
              <li>
                <strong>Jobs</strong>
                <span>Live Remotive & Arbeitnow postings scored to your skills, plus Indeed/LinkedIn searches for your country.</span>
              </li>
              <li>
                <strong>Weekly</strong>
                <span>Auto-refresh when results are older than 7 days. You can also hit Refresh from web anytime.</span>
              </li>
            </ul>
            <a className="text-link" href="https://remotive.com/remote-jobs" target="_blank" rel="noreferrer">
              Remotive feed →
            </a>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
