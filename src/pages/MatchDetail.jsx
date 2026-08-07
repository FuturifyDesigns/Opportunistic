import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export default function MatchDetail() {
  const { kind, id } = useParams()
  const { user } = useAuth()
  const [match, setMatch] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Match detail — Opportunistic'
    const table = kind === 'job' ? 'job_matches' : 'scholarship_matches'
    supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setMatch(data)
      })
  }, [kind, id, user.id])

  async function toggle(field) {
    const table = kind === 'job' ? 'job_matches' : 'scholarship_matches'
    const next = { [field]: !match[field] }
    const { data } = await supabase.from(table).update(next).eq('id', match.id).select().single()
    if (data) setMatch(data)
  }

  return (
    <div className="page">
      <SiteHeader />
      <main className="container narrow">
        <Link to="/dashboard" className="back-link">← Back to dashboard</Link>
        {error ? <p className="form-message">{error}</p> : null}
        {!match ? (
          <div className="page-center"><div className="spinner" /></div>
        ) : (
          <article className="detail">
            <p className="eyebrow">{match.source || kind}</p>
            <h1>{match.title}</h1>
            {match.company ? <p className="muted">{match.company}</p> : null}
            <div className="score-pill large">{Math.round(match.match_score)}% match</div>

            <h2>Why this fits</h2>
            <p className="reasoning-block">{match.reasoning}</p>

            {match.deadline ? (
              <p>
                <strong>Deadline:</strong> {match.deadline}
              </p>
            ) : null}

            <div className="cta-row">
              <a className="btn" href={match.url} target="_blank" rel="noreferrer">
                Open source listing
              </a>
              <button type="button" className="btn btn-ghost" onClick={() => toggle('saved')}>
                {match.saved ? 'Unsave' : 'Save'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => toggle('dismissed')}>
                {match.dismissed ? 'Restore' : 'Dismiss'}
              </button>
            </div>
          </article>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
