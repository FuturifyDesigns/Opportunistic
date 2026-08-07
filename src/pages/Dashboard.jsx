import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import MatchCard from '../components/MatchCard'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

gsap.registerPlugin(useGSAP)

export default function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('scholarships')
  const [scholarships, setScholarships] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const listRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const [{ data: s }, { data: j }] = await Promise.all([
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
    setScholarships(s || [])
    setJobs(j || [])
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    document.title = 'Dashboard — Opportunistic'
    load()
  }, [load])

  useGSAP(
    () => {
      if (loading) return
      gsap.from('.match-card', {
        y: 18,
        opacity: 0,
        duration: 0.35,
        stagger: 0.06,
        ease: 'power2.out',
      })
    },
    { scope: listRef, dependencies: [loading, tab, scholarships, jobs] },
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

  const rows = tab === 'scholarships' ? scholarships : jobs

  return (
    <div className="page">
      <SiteHeader />
      <main className="container dashboard">
        <div className="dashboard-head">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Hello{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.</h1>
            <p className="muted">
              Ranked matches for {profile?.country || 'your country'} — reasoning shown on every card.
            </p>
          </div>
          <Link className="btn btn-ghost" to="/profile">
            Edit profile
          </Link>
        </div>

        <div className="segmented">
          <button type="button" className={tab === 'scholarships' ? 'active' : ''} onClick={() => setTab('scholarships')}>
            Scholarships ({scholarships.length})
          </button>
          <button type="button" className={tab === 'jobs' ? 'active' : ''} onClick={() => setTab('jobs')}>
            Jobs ({jobs.length})
          </button>
        </div>

        <div className="dashboard-layout">
          <div ref={listRef} className="match-list">
            {loading ? (
              <div className="page-center"><div className="spinner" /></div>
            ) : rows.length === 0 ? (
              <div className="empty-state">
                <h3>No matches yet</h3>
                <p>Complete or update your profile to generate scholarship and job matches.</p>
                <Link className="btn" to="/profile">Update profile</Link>
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

          <aside className="ad-slot" aria-label="Sponsored">
            <p className="eyebrow">Sponsored</p>
            <p className="muted">Ad placement reserved (AdSense). Max 1–2 units; never inside forms.</p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
