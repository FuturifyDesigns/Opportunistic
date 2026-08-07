import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getListingBySource } from '../lib/listingCatalog'
import { generateWinTips } from '../lib/tipEngine'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

function splitSentences(text = '') {
  return text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function MatchDetail() {
  const { kind, id } = useParams()
  const { user, profile } = useAuth()
  const [match, setMatch] = useState(null)
  const [qualifications, setQualifications] = useState([])
  const [skills, setSkills] = useState([])
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [activeImage, setActiveImage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [tipNonce, setTipNonce] = useState(0)

  const table = kind === 'job' ? 'job_matches' : kind === 'scholarship' ? 'scholarship_matches' : null
  const listing = useMemo(() => getListingBySource(match?.source), [match?.source])

  const winTips = useMemo(() => {
    if (!match) return { tips: [] }
    return generateWinTips({
      kind: kind === 'job' ? 'job' : 'scholarship',
      profile,
      qualifications,
      skills,
      listing,
      match: { ...match, found_at: `${match.found_at || ''}|n${tipNonce}` },
      count: 6,
    })
  }, [match, profile, qualifications, skills, listing, kind, tipNonce])

  useEffect(() => {
    document.title = match?.title ? `${match.title} — Opportunistic` : 'Match detail — Opportunistic'
  }, [match?.title])

  useEffect(() => {
    let cancelled = false
    setMatch(null)
    setError('')
    setNotFound(false)
    setActiveImage(null)
    setTipNonce(0)

    if (!table) {
      setError('Unknown listing type.')
      setNotFound(true)
      return undefined
    }
    if (!user?.id || !id) {
      setError('Missing match reference.')
      setNotFound(true)
      return undefined
    }

    Promise.all([
      supabase.from(table).select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('qualifications').select('*').eq('user_id', user.id),
      supabase.from('skills').select('*').eq('user_id', user.id),
    ]).then(([matchRes, qualRes, skillRes]) => {
      if (cancelled) return
      if (matchRes.error) {
        setError(matchRes.error.message)
        setNotFound(true)
        return
      }
      if (!matchRes.data) {
        setNotFound(true)
        setError('This match is no longer available. It may have been refreshed after a profile update.')
        return
      }
      setMatch(matchRes.data)
      setQualifications(qualRes.data || [])
      setSkills(skillRes.data || [])
    })

    return () => {
      cancelled = true
    }
  }, [table, id, user?.id])

  async function toggle(field) {
    if (!match || !table || busy) return
    setBusy(true)
    try {
      const next = { [field]: !match[field] }
      const { data, error: err } = await supabase
        .from(table)
        .update(next)
        .eq('id', match.id)
        .eq('user_id', user.id)
        .select()
        .single()
      if (err) throw err
      if (data) setMatch(data)
    } catch (err) {
      setError(err.message || 'Could not update match')
    } finally {
      setBusy(false)
    }
  }

  const gallery = listing?.gallery?.filter(Boolean) || []
  const cover = listing?.cover || gallery[0] || null
  const reasons = splitSentences(match?.reasoning || '')

  return (
    <div className="page">
      <SiteHeader />
      <main className="container detail-page">
        <Link to="/dashboard" className="back-link">
          ← Back to dashboard
        </Link>

        {error ? <p className="form-message">{error}</p> : null}

        {notFound && !match ? (
          <div className="empty-state">
            <h3>Listing unavailable</h3>
            <p>Return to the dashboard and open a current match. Saving your profile rebuilds results from your latest data.</p>
            <Link className="btn" to="/dashboard">
              Go to dashboard
            </Link>
          </div>
        ) : null}

        {!match && !notFound ? (
          <div className="page-center">
            <div className="spinner" />
          </div>
        ) : null}

        {match ? (
          <article className="detail detail-rich">
            {cover ? (
              <div className="detail-hero">
                <img
                  src={cover}
                  alt=""
                  className="detail-cover"
                  loading="eager"
                  onClick={() => setActiveImage(cover)}
                />
                <div className="detail-hero-meta">
                  <p className="eyebrow">{match.source || kind}</p>
                  <h1>{match.title}</h1>
                  {match.company ? <p className="muted">{match.company}</p> : null}
                  <div className="detail-badges">
                    <span className="score-pill large">{Math.round(Number(match.match_score) || 0)}% match</span>
                    {listing?.level ? <span className="info-chip">{listing.level}</span> : null}
                    {listing?.location ? <span className="info-chip">{listing.location}</span> : null}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="eyebrow">{match.source || kind}</p>
                <h1>{match.title}</h1>
                {match.company ? <p className="muted">{match.company}</p> : null}
                <div className="score-pill large">{Math.round(Number(match.match_score) || 0)}% match</div>
              </>
            )}

            {listing?.tags?.length ? (
              <div className="feed-chips detail-tags">
                {listing.tags.map((tag) => (
                  <span key={tag} className="feed-chip">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {listing?.summary ? (
              <section className="detail-section">
                <h2>About this listing</h2>
                <p>{listing.summary}</p>
              </section>
            ) : null}

            <section className="detail-section tip-playbook">
              <div className="tip-playbook-head">
                <div>
                  <h2>Your playbook to win this</h2>
                  <p className="muted detail-note" style={{ marginTop: 0 }}>
                    Unique tips built from your profile, skills, and this listing. They refresh when you edit your
                    profile — or tap New tips.
                  </p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTipNonce((n) => n + 1)}>
                  New tips
                </button>
              </div>
              <ol className="tip-playbook-list">
                {winTips.tips.map((tip, i) => (
                  <li key={`${tipNonce}-${i}`}>
                    <span className="tip-index">{i + 1}</span>
                    <p>{tip}</p>
                  </li>
                ))}
              </ol>
            </section>

            {gallery.length > 0 ? (
              <section className="detail-section">
                <h2>Gallery</h2>
                <div className="detail-gallery">
                  {gallery.map((src) => (
                    <button
                      type="button"
                      key={src}
                      className="detail-gallery-item"
                      onClick={() => setActiveImage(src)}
                      aria-label="Expand gallery image"
                    >
                      <img src={src} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="detail-section detail-grid-facts">
              <h2>Key facts</h2>
              <dl className="fact-grid">
                {listing?.funding ? (
                  <>
                    <dt>Funding</dt>
                    <dd>{listing.funding}</dd>
                  </>
                ) : null}
                {listing?.level ? (
                  <>
                    <dt>Level</dt>
                    <dd>{listing.level}</dd>
                  </>
                ) : null}
                {listing?.location ? (
                  <>
                    <dt>Location</dt>
                    <dd>{listing.location}</dd>
                  </>
                ) : null}
                <dt>Deadline</dt>
                <dd>{match.deadline || listing?.deadlineLabel || 'Check source listing'}</dd>
                <dt>Source</dt>
                <dd>{match.source || '—'}</dd>
                {match.company ? (
                  <>
                    <dt>Employers</dt>
                    <dd>{match.company}</dd>
                  </>
                ) : null}
              </dl>
            </section>

            {listing?.highlights?.length ? (
              <section className="detail-section">
                <h2>What you get</h2>
                <ul className="detail-list">
                  {listing.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {listing?.eligibility?.length ? (
              <section className="detail-section">
                <h2>Eligibility snapshot</h2>
                <ul className="detail-list">
                  {listing.eligibility.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="muted detail-note">
                  Always confirm the latest rules on the official source — programs change by cycle and nationality.
                </p>
              </section>
            ) : null}

            {listing?.howToApply?.length ? (
              <section className="detail-section">
                <h2>How to apply</h2>
                <ol className="detail-list numbered">
                  {listing.howToApply.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>
            ) : null}

            <section className="detail-section">
              <h2>Why this fits you</h2>
              <div className="reasoning-block">
                {reasons.length ? (
                  reasons.map((sentence, i) => (
                    <p key={i} className="reasoning-line">
                      {sentence}
                    </p>
                  ))
                ) : (
                  <p className="reasoning-line">Open the source listing and compare requirements to your profile.</p>
                )}
              </div>
            </section>

            <div className="cta-row sticky-cta">
              <a className="btn" href={match.url} target="_blank" rel="noreferrer noopener">
                Open official listing
              </a>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => toggle('saved')}>
                {match.saved ? 'Unsave' : 'Save'}
              </button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => toggle('dismissed')}>
                {match.dismissed ? 'Restore' : 'Dismiss'}
              </button>
            </div>
          </article>
        ) : null}

        {activeImage ? (
          <button type="button" className="lightbox" onClick={() => setActiveImage(null)} aria-label="Close image">
            <img src={activeImage} alt="" />
          </button>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}
