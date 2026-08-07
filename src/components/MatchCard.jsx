import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

export default function MatchCard({ match, kind, onSave, onDismiss, onOpen }) {
  const score = Math.round(Number(match.match_score) || 0)
  const ref = useRef(null)

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
          y: -6,
          boxShadow: '0 22px 50px rgba(20,22,26,0.12)',
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
          boxShadow: '0 18px 40px rgba(20, 22, 26, 0.06)',
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

  return (
    <article ref={ref} className="match-card interactive">
      <button type="button" className="match-card-hit" onClick={() => onOpen?.(match)} aria-label={`Open ${match.title}`}>
        <div className="match-card-top">
          <div>
            <p className="eyebrow">{match.source || kind}</p>
            <h3>{match.title}</h3>
            {match.company ? <p className="muted">{match.company}</p> : null}
          </div>
          <div className="score-pill" title="Match score">
            {score}%
          </div>
        </div>
        <p className="reasoning">{match.reasoning}</p>
        <div className="match-meta">
          {match.deadline ? <span>Deadline: {match.deadline}</span> : <span>Rolling / check source</span>}
          <span>Found {new Date(match.found_at || Date.now()).toLocaleDateString()}</span>
        </div>
      </button>

      <div className="match-actions">
        <a className="btn btn-sm" href={match.url} target="_blank" rel="noreferrer">
          Open listing
        </a>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSave?.(match)}>
          {match.saved ? 'Saved' : 'Save'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDismiss?.(match)}>
          Dismiss
        </button>
      </div>
    </article>
  )
}
