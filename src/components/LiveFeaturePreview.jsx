import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import InteractiveCard from './InteractiveCard'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

export default function LiveFeaturePreview({ kind = 'scholarship', title }) {
  const root = useRef(null)
  const { t, i18n } = useTranslation()

  const PREVIEWS = useMemo(
    () => ({
      scholarship: {
        label: t('featurePreview.scholarshipLabel'),
        rows: [
          { title: t('featurePreview.scholarshipRow1'), score: 91 },
          { title: t('featurePreview.scholarshipRow2'), score: 87 },
          { title: t('featurePreview.scholarshipRow3'), score: 78 },
        ],
      },
      job: {
        label: t('featurePreview.jobLabel'),
        rows: [
          { title: t('featurePreview.jobRow1'), score: 89 },
          { title: t('featurePreview.jobRow2'), score: 84 },
          { title: t('featurePreview.jobRow3'), score: 71 },
        ],
      },
      profile: {
        label: t('featurePreview.profileLabel'),
        rows: [
          { title: t('featurePreview.profileRow1'), score: 100 },
          { title: t('featurePreview.profileRow2'), score: 80 },
          { title: t('featurePreview.profileRow3'), score: 65 },
        ],
      },
      privacy: {
        label: t('featurePreview.privacyLabel'),
        rows: [
          { title: t('featurePreview.privacyRow1'), score: 70 },
          { title: t('featurePreview.privacyRow2'), score: 95 },
          { title: t('featurePreview.privacyRow3'), score: 100 },
        ],
      },
    }),
    [t, i18n.language],
  )

  const data = PREVIEWS[kind] || PREVIEWS.scholarship

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      const bars = root.current.querySelectorAll('.live-bar-fill')
      const scores = root.current.querySelectorAll('.live-score')
      const rows = root.current.querySelectorAll('.live-row')

      gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' })
      gsap.to(bars, {
        scaleX: 1,
        duration: 1.1,
        stagger: 0.18,
        ease: 'power2.out',
        repeat: -1,
        repeatDelay: 1.4,
        yoyo: true,
      })

      gsap.fromTo(
        rows,
        { x: 10, opacity: 0.35 },
        {
          x: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.15,
          ease: 'power2.out',
          repeat: -1,
          repeatDelay: 2.2,
          yoyo: true,
        },
      )

      scores.forEach((el, i) => {
        const target = Number(el.dataset.score || 80)
        const obj = { val: Math.max(40, target - 18) }
        gsap.to(obj, {
          val: target,
          duration: 1.2,
          delay: i * 0.15,
          ease: 'power2.out',
          repeat: -1,
          repeatDelay: 1.6,
          yoyo: true,
          onUpdate: () => {
            el.textContent = `${Math.round(obj.val)}%`
          },
        })
      })

      gsap.to(root.current.querySelector('.live-pulse'), {
        scale: 1.35,
        opacity: 0,
        duration: 1.4,
        repeat: -1,
        ease: 'power1.out',
      })
    },
    { scope: root, dependencies: [kind, i18n.language] },
  )

  return (
    <InteractiveCard className="feature-showcase live-preview">
      <div ref={root} className="live-preview-inner">
        <div className="live-preview-head">
          <p className="eyebrow">{t('featurePreview.preview')}</p>
          <span className="live-dot">
            <i className="live-pulse" aria-hidden="true" />
            {t('featurePreview.live')}
          </span>
        </div>
        <strong>{title}</strong>
        <p className="muted live-caption">{data.label}</p>
        <div className="live-rows">
          {data.rows.map((row) => (
            <div className="live-row" key={row.title}>
              <div className="live-row-meta">
                <span>{row.title}</span>
                <span className="live-score" data-score={row.score}>
                  {row.score}%
                </span>
              </div>
              <div className="live-bar">
                <span className="live-bar-fill" style={{ width: `${row.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </InteractiveCard>
  )
}
