import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion, canHoverTilt } from '../lib/animations'
import { getListingBySource } from '../lib/listingCatalog'
import { unpackReasoning } from '../lib/skillMatch'
import { shortMatchReason } from '../lib/matchReason'
import ListingImage, { DEFAULT_OPPORTUNITY_IMAGE } from './ListingImage'
import SkillScorecard from './SkillScorecard'
import UserAvatar from './UserAvatar'
import CensoredText from './CensoredText'

gsap.registerPlugin(useGSAP)

export default function MatchCard({
  match,
  kind,
  country = '',
  onSave,
  onDismiss,
  onOpen,
  onRecommend,
  showDetails = false,
  recommendedBy = '',
  recNote = '',
  recAvatar = '',
}) {
  const { t, i18n } = useTranslation()
  const score = Math.round(Number(match.match_score) || 0)
  const ref = useRef(null)
  const listing = getListingBySource(match.source)
  const thumb = listing?.cover || listing?.gallery?.[0] || DEFAULT_OPPORTUNITY_IMAGE
  const { text: storedReason, scorecard } = unpackReasoning(match.reasoning || '')
  const liveReason = shortMatchReason({
    kind: kind === 'scholarships' || kind === 'scholarship' ? 'scholarship' : 'job',
    title: match.title,
    company: match.company,
    location: match.location || scorecard?.location?.label,
    source: match.source,
    country,
    scorecard,
    focus: listing?.summary || listing?.focus || '',
  })
  const shortReason = liveReason || storedReason
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' ')

  useGSAP(
    () => {
      const el = ref.current
      if (!el || prefersReducedMotion() || !canHoverTilt()) return

      const onMove = (e) => {
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        gsap.to(el, {
          rotateY: x * 7,
          rotateX: -y * 6,
          y: -4,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 900,
        })
      }
      const onLeave = () => {
        gsap.to(el, {
          rotateY: 0,
          rotateX: 0,
          y: 0,
          duration: 0.4,
          ease: 'power3.out',
        })
      }

      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
      return () => {
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
      }
    },
    { scope: ref },
  )

  const foundDate = new Date(match.found_at || Date.now()).toLocaleDateString(i18n.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <article ref={ref} className={`match-card interactive${recommendedBy ? ' rec-match-card' : ''}`}>
      {recommendedBy ? (
        <div className="match-rec-banner">
          <UserAvatar url={recAvatar} name={recommendedBy} size={28} />
          <div>
            <p>{t('recommend.from', { name: recommendedBy })}</p>
            {recNote ? (
              <p className="match-rec-note">
                <CensoredText text={recNote} />
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className="match-card-hit"
        onClick={() => onOpen?.(match)}
        aria-label={t('matchCard.openAria', { title: match.title })}
      >
        <div className="match-card-media">
          <ListingImage src={thumb} loading="lazy" />
        </div>
        <div className="match-card-top">
          <div>
            <p className="eyebrow">{match.source || kind}</p>
            <h3>{match.title}</h3>
            {match.company ? <p className="muted">{match.company}</p> : null}
            {match.location ? <p className="muted match-location">{match.location}</p> : null}
          </div>
          <div className="score-pill" title={t('matchCard.scoreTitle')}>
            {score}%
          </div>
        </div>
        <p className="reasoning">{shortReason || t('match.reasonFallback')}</p>
        {scorecard ? <SkillScorecard scorecard={scorecard} compact /> : null}
        <div className="match-meta">
          {match.deadline ? (
            <span>{t('matchCard.deadline', { date: match.deadline })}</span>
          ) : listing?.deadlineLabel ? (
            <span>{listing.deadlineLabel}</span>
          ) : null}
          <span>{t('matchCard.found', { date: foundDate })}</span>
        </div>
      </button>

      <div className="match-actions">
        {showDetails && onOpen ? (
          <button type="button" className="btn btn-sm" onClick={() => onOpen(match)}>
            {t('matchCard.seeDetails')}
          </button>
        ) : null}
        <a className="btn btn-sm" href={match.url} target="_blank" rel="noreferrer noopener">
          {t('matchCard.openListing')}
        </a>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSave?.(match)}>
          {match.saved ? t('matchCard.saved') : t('matchCard.save')}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDismiss?.(match)}>
          {t('matchCard.dismiss')}
        </button>
        {onRecommend ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRecommend(match)}>
            {t('matchCard.recommend')}
          </button>
        ) : null}
      </div>
    </article>
  )
}
