import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getListingBySource } from '../lib/listingCatalog'
import { generateWinTips } from '../lib/tipEngine'
import { unpackReasoning } from '../lib/skillMatch'
import { explainMatch } from '../lib/matchReason'
import { trackEngage } from '../lib/analytics'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import ListingImage, { DEFAULT_OPPORTUNITY_IMAGE } from '../components/ListingImage'
import SkillScorecard from '../components/SkillScorecard'
import RecommendMatchDialog from '../components/RecommendMatchDialog'

function splitSentences(text = '') {
  return text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function MatchDetail() {
  const { kind, id } = useParams()
  const { user, profile } = useAuth()
  const toast = useToast()
  const { t, i18n } = useTranslation()
  const [match, setMatch] = useState(null)
  const [qualifications, setQualifications] = useState([])
  const [skills, setSkills] = useState([])
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [activeImage, setActiveImage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [tipNonce, setTipNonce] = useState(0)
  const [recommendOpen, setRecommendOpen] = useState(false)

  const table = kind === 'job' ? 'job_matches' : kind === 'scholarship' ? 'scholarship_matches' : null
  const listing = useMemo(() => getListingBySource(match?.source), [match?.source])

  const winTips = useMemo(() => {
    if (!match) return { tips: [] }
    const { scorecard } = unpackReasoning(match.reasoning || '')
    return generateWinTips({
      kind: kind === 'job' ? 'job' : 'scholarship',
      profile,
      qualifications,
      skills,
      listing,
      match: { ...match, found_at: `${match.found_at || ''}|n${tipNonce}` },
      scorecard,
      count: 6,
    })
  }, [match, profile, qualifications, skills, listing, kind, tipNonce, i18n.language])

  useEffect(() => {
    document.title = match?.title ? `${match.title} — Opportunistic` : t('match.metaTitle')
  }, [match?.title, t, i18n.language])

  useEffect(() => {
    let cancelled = false
    setMatch(null)
    setError('')
    setNotFound(false)
    setActiveImage(null)
    setTipNonce(0)

    if (!table) {
      setError(t('match.unknownType'))
      setNotFound(true)
      return undefined
    }
    if (!user?.id || !id) {
      setError(t('match.missingRef'))
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
        setError(t('match.gone'))
        return
      }
      setMatch(matchRes.data)
      setQualifications(qualRes.data || [])
      setSkills(skillRes.data || [])
    })

    return () => {
      cancelled = true
    }
  }, [table, id, user?.id, t])

  async function toggle(field) {
    if (!match || !table || busy) return
    setBusy(true)
    try {
      const nextValue = !match[field]
      const next = { [field]: nextValue }
      const { data, error: err } = await supabase
        .from(table)
        .update(next)
        .eq('id', match.id)
        .eq('user_id', user.id)
        .select()
        .single()
      if (err) throw err
      if (data) setMatch(data)
      if (field === 'saved') {
        trackEngage(nextValue ? 'save' : 'unsave', { kind, matchId: match.id }, user?.id)
        toast.success(nextValue ? t('match.savedToast') : t('match.unsavedToast'))
      } else if (field === 'dismissed') {
        trackEngage(nextValue ? 'dismiss' : 'restore', { kind, matchId: match.id }, user?.id)
        toast.info(nextValue ? t('match.dismissedToast') : t('match.restoredToast'))
      }
    } catch (err) {
      const msg = err.message || t('match.updateFailed')
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  const gallery = listing?.gallery?.filter(Boolean) || []
  const cover = listing?.cover || gallery[0] || DEFAULT_OPPORTUNITY_IMAGE
  const { text: storedReason, scorecard } = unpackReasoning(match?.reasoning || '')
  const liveReason = explainMatch({
    kind: kind === 'job' ? 'job' : 'scholarship',
    title: match?.title,
    company: match?.company,
    location: match?.location || listing?.location || scorecard?.location?.label,
    source: match?.source,
    country: profile?.country || '',
    scorecard,
    focus: listing?.summary || listing?.focus || '',
    qualification: qualifications?.[0]
      ? `${qualifications[0].type === 'certificate' ? t('reasons.certificate') : t('reasons.degree')} in ${qualifications[0].field}`
      : '',
  })
  const reasons = splitSentences(liveReason || storedReason)
  const locationLabel = match?.location || listing?.location || scorecard?.location?.label || null

  return (
    <div className="page">
      <SiteHeader />
      <main className="container detail-page">
        <Link to="/dashboard" className="back-link">
          {t('match.back')}
        </Link>

        {error ? <p className="form-message">{error}</p> : null}

        {notFound && !match ? (
          <div className="empty-state">
            <h3>{t('match.emptyTitle')}</h3>
            <p>{t('match.emptyBody')}</p>
            <Link className="btn" to="/dashboard">
              {t('match.emptyCta')}
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
            <div className="detail-hero">
              <ListingImage
                src={cover}
                className="detail-cover"
                loading="eager"
                onClick={() => setActiveImage(cover)}
              />
              <div className="detail-hero-meta">
                <p className="eyebrow">{match.source || kind}</p>
                <h1>{match.title}</h1>
                {match.company ? <p className="muted">{match.company}</p> : null}
                <div className="detail-badges">
                  <span className="score-pill large">
                    {t('match.scorePill', { score: Math.round(Number(match.match_score) || 0) })}
                  </span>
                  {listing?.level ? <span className="info-chip">{listing.level}</span> : null}
                  {locationLabel ? <span className="info-chip">{locationLabel}</span> : null}
                </div>
              </div>
            </div>

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
                <h2>{t('match.aboutTitle')}</h2>
                <p>{listing.summary}</p>
              </section>
            ) : null}

            <section className="detail-section tip-playbook">
              <div className="tip-playbook-head">
                <div>
                  <h2>{t('match.playbookTitle')}</h2>
                  <p className="muted detail-note" style={{ marginTop: 0 }}>
                    {t('match.playbookNote')}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setTipNonce((n) => n + 1)
                    toast.success(t('match.tipsRefreshed'))
                  }}
                >
                  {t('match.newTips')}
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
                <h2>{t('match.galleryTitle')}</h2>
                <div className="detail-gallery">
                  {gallery.map((src) => (
                    <button
                      type="button"
                      key={src}
                      className="detail-gallery-item"
                      onClick={() => setActiveImage(src)}
                      aria-label={t('match.expandGallery')}
                    >
                      <ListingImage src={src} loading="lazy" />
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="detail-section detail-grid-facts">
              <h2>{t('match.factsTitle')}</h2>
              <dl className="fact-grid">
                {listing?.funding ? (
                  <>
                    <dt>{t('match.factFunding')}</dt>
                    <dd>{listing.funding}</dd>
                  </>
                ) : null}
                {listing?.level ? (
                  <>
                    <dt>{t('match.factLevel')}</dt>
                    <dd>{listing.level}</dd>
                  </>
                ) : null}
                {locationLabel ? (
                  <>
                    <dt>{t('match.factLocation')}</dt>
                    <dd>{locationLabel}</dd>
                  </>
                ) : null}
                <dt>{t('match.factDeadline')}</dt>
                <dd>{match.deadline || listing?.deadlineLabel || t('match.deadlineFallback')}</dd>
                <dt>{t('match.factSource')}</dt>
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
                <h2>{t('match.whatYouGet')}</h2>
                <ul className="detail-list">
                  {listing.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {listing?.eligibility?.length ? (
              <section className="detail-section">
                <h2>{t('match.eligibilityTitle')}</h2>
                <ul className="detail-list">
                  {listing.eligibility.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="muted detail-note">{t('match.eligibilityNote')}</p>
              </section>
            ) : null}

            {listing?.howToApply?.length ? (
              <section className="detail-section">
                <h2>{t('match.howToApply')}</h2>
                <ol className="detail-list numbered">
                  {listing.howToApply.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>
            ) : null}

            <section className="detail-section">
              <h2>{t('match.whyFits')}</h2>
              {scorecard ? <SkillScorecard scorecard={scorecard} /> : null}
              <div className="reasoning-block">
                {reasons.length ? (
                  reasons.map((sentence, i) => (
                    <p key={i} className="reasoning-line">
                      {sentence}
                    </p>
                  ))
                ) : (
                  <p className="reasoning-line">{t('match.reasonFallback')}</p>
                )}
              </div>
            </section>

            <div className="cta-row sticky-cta">
              <a className="btn" href={match.url} target="_blank" rel="noreferrer noopener">
                {t('match.openOfficial')}
              </a>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => toggle('saved')}>
                {match.saved ? t('match.unsave') : t('match.save')}
              </button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => toggle('dismissed')}>
                {match.dismissed ? t('match.restore') : t('match.dismiss')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setRecommendOpen(true)}>
                {t('matchCard.recommend')}
              </button>
            </div>
          </article>
        ) : null}

        {activeImage ? (
          <button type="button" className="lightbox" onClick={() => setActiveImage(null)} aria-label={t('match.closeImage')}>
            <ListingImage src={activeImage} loading="eager" />
          </button>
        ) : null}
      </main>
      <SiteFooter />
      <RecommendMatchDialog
        open={recommendOpen}
        match={match}
        kind={kind}
        onClose={() => setRecommendOpen(false)}
      />
    </div>
  )
}
