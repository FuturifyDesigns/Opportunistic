import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import InteractiveCard from './InteractiveCard'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

const PREVIEWS = {
  scholarship: {
    label: 'Live match stream',
    rows: [
      { title: 'Chevening', score: 91 },
      { title: 'Mastercard Scholars', score: 87 },
      { title: 'DAAD Database', score: 78 },
    ],
  },
  job: {
    label: 'Country-filtered roles',
    rows: [
      { title: 'React · Junior', score: 89 },
      { title: 'Frontend · Remote', score: 84 },
      { title: 'Support Engineer', score: 71 },
    ],
  },
  profile: {
    label: 'Guided feed',
    rows: [
      { title: 'Country locked', score: 100 },
      { title: 'Qualifications', score: 80 },
      { title: 'Skills weighted', score: 65 },
    ],
  },
  privacy: {
    label: 'Control panel',
    rows: [
      { title: 'Digest · weekly', score: 70 },
      { title: 'RLS · own data', score: 95 },
      { title: 'Delete cascade', score: 100 },
    ],
  },
}

export default function LiveFeaturePreview({ kind = 'scholarship', title }) {
  const root = useRef(null)
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
    { scope: root, dependencies: [kind] },
  )

  return (
    <InteractiveCard className="feature-showcase live-preview">
      <div ref={root} className="live-preview-inner">
        <div className="live-preview-head">
          <p className="eyebrow">Preview</p>
          <span className="live-dot">
            <i className="live-pulse" aria-hidden="true" />
            Live
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
