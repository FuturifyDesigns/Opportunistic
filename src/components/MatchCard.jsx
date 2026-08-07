import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../lib/animations'
import { getListingBySource } from '../lib/listingCatalog'

gsap.registerPlugin(useGSAP)

export default function MatchCard({ match, kind, onSave, onDismiss, onOpen }) {
  const { t, i18n } = useTranslation()
  const score = Math.round(Number(match.match_score) || 0)
  const ref = useRef(null)
  const listing = getListingBySource(match.source)
  const thumb = listing?.cover || listing?.gallery?.[0] || null

  useGSAP(
    () => {
      const el = ref.current
      if (!el || prefersReducedMotion()) return

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

  const foundDate = new Date(match.found_at || Date.now()).toLocaleDateString(i18n.language)

  return (
    <article ref={ref} className="match-card interactive">
      <button
        type="button"
        className="match-card-hit"
        onClick={() => onOpen?.(match)}
        aria-label={t('matchCard.openAria', { title: match.title })}
      >
        {thumb ? (
          <div className="match-card-media">
            <img src={thumb} alt="" loading="lazy" />
          </div>
        ) : null}
        <div className="match-card-top">
          <div>
            <p className="eyebrow">{match.source || kind}</p>
            <h3>{match.title}</h3>
            {match.company ? <p className="muted">{match.company}</p> : null}
          </div>
          <div className="score-pill" title={t('matchCard.scoreTitle')}>
            {score}%
          </div>
        </div>
        <p className="reasoning">
          {(match.reasoning || '')
            .split(/(?<=\.)\s+/)
            .slice(0, 2)
            .join(' ')}
        </p>
        <div className="match-meta">
          {match.deadline ? (
            <span>{t('matchCard.deadline', { date: match.deadline })}</span>
          ) : listing?.deadlineLabel ? (
            <span>{listing.deadlineLabel}</span>
          ) : (
            <span>{t('matchCard.rolling')}</span>
          )}
          <span>{t('matchCard.found', { date: foundDate })}</span>
        </div>
      </button>

      <div className="match-actions">
        <a className="btn btn-sm" href={match.url} target="_blank" rel="noreferrer noopener">
          {t('matchCard.openListing')}
        </a>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSave?.(match)}>
          {match.saved ? t('matchCard.saved') : t('matchCard.save')}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDismiss?.(match)}>
          {t('matchCard.dismiss')}
        </button>
      </div>
    </article>
  )
}
