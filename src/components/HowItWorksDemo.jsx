import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

const PHASES = [
  { id: 'ingest', label: 'INGEST', title: 'Feed your profile' },
  { id: 'process', label: 'PROCESS', title: 'Opportunistic thinks' },
  { id: 'output', label: 'OUTPUT', title: 'Matches with reasons' },
]

const LOG_LINES = {
  ingest: [
    '> awaiting profile stream…',
    '> country=Botswana',
    '> qual=BSc Computer Science',
    '> skills=[React, AWS]',
    '> profile hash locked ✓',
  ],
  process: [
    '> building search vectors…',
    '> query: CS scholarships Southern Africa 2026',
    '> query: React junior jobs Botswana',
    '> scoring candidates…',
    '> writing fit reasons…',
  ],
  output: [
    '> rank complete',
    '> 3 high-confidence matches',
    '> reasoning attached to each card',
    '> ready for human review',
  ],
}

const DEMO_MATCHES = [
  {
    title: 'Mastercard Foundation Scholars',
    score: 94,
    reason: 'Matches your BSc Computer Science + Southern Africa eligibility.',
  },
  {
    title: 'React developer roles — LinkedIn',
    score: 88,
    reason: 'Aligned with React experience; filtered to your country.',
  },
  {
    title: 'Chevening Scholarships',
    score: 81,
    reason: 'Fits postgraduate path and Commonwealth applicant profile.',
  },
]

export default function HowItWorksDemo() {
  const root = useRef(null)
  const [phase, setPhase] = useState(0)
  const [logs, setLogs] = useState([])
  const auto = useRef(true)

  useEffect(() => {
    if (prefersReducedMotion() || !auto.current) return undefined
    const id = window.setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 5200)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const lines = LOG_LINES[PHASES[phase].id]
    setLogs([])
    if (prefersReducedMotion()) {
      setLogs(lines)
      return undefined
    }
    let i = 0
    const id = window.setInterval(() => {
      setLogs((prev) => [...prev, lines[i]])
      i += 1
      if (i >= lines.length) window.clearInterval(id)
    }, 420)
    return () => window.clearInterval(id)
  }, [phase])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.jarvis-screen', { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' })
      gsap.from('.demo-step', {
        opacity: 0,
        x: -24,
        stagger: 0.1,
        duration: 0.45,
        ease: 'power2.out',
      })
    },
    { scope: root },
  )

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      tl.fromTo('.jarvis-stage', { opacity: 0 }, { opacity: 1, duration: 0.35 })

      if (phase === 0) {
        tl.fromTo('.feed-chip', { opacity: 0, x: -16 }, { opacity: 1, x: 0, stagger: 0.1, duration: 0.35 }, 0.1)
      }
      if (phase === 1) {
        tl.fromTo('.scan-ring', { scale: 0.7, opacity: 0.2 }, { scale: 1.2, opacity: 0, duration: 1.2, repeat: 2 }, 0)
        tl.fromTo('.hud-meter > span', { scaleX: 0 }, { scaleX: 1, stagger: 0.12, duration: 0.6 }, 0.15)
      }
      if (phase === 2) {
        tl.fromTo('.jarvis-match', { opacity: 0, y: 18 }, { opacity: 1, y: 0, stagger: 0.12, duration: 0.4 }, 0.05)
      }
    },
    { scope: root, dependencies: [phase], revertOnUpdate: true },
  )

  return (
    <div ref={root} className="how-demo jarvis-demo">
      <div className="demo-steps">
        {PHASES.map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={`demo-step ${i === phase ? 'active' : ''}`}
            onClick={() => {
              auto.current = false
              setPhase(i)
            }}
          >
            <span>{p.label}</span>
            <strong>{p.title}</strong>
            <p>
              {i === 0 && 'You feed Opportunistic your country, qualifications, and skills — one clear step at a time.'}
              {i === 1 && 'It builds queries from your profile, searches, scores, and writes why each result fits.'}
              {i === 2 && 'You get ranked cards with visible reasoning — like a brief from an assistant, not a dump of links.'}
            </p>
          </button>
        ))}
      </div>

      <div className="jarvis-screen" aria-live="polite">
        <div className="jarvis-chrome">
          <div className="jarvis-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="jarvis-title">OPPORTUNISTIC // MATCH CONSOLE</p>
          <p className="jarvis-status">{PHASES[phase].label}</p>
        </div>

        <div className="jarvis-body">
          <div className="jarvis-stage">
            {phase === 0 && (
              <div className="jarvis-ingest">
                <p className="jarvis-caption">Incoming profile feed</p>
                <div className="feed-chips">
                  {['Country · Botswana', 'Degree · CS', 'Skill · React', 'Skill · AWS', 'Goal · Scholarships + jobs'].map(
                    (c) => (
                      <span key={c} className="feed-chip">
                        {c}
                      </span>
                    ),
                  )}
                </div>
                <div className="ingest-beam" aria-hidden="true" />
              </div>
            )}

            {phase === 1 && (
              <div className="jarvis-process">
                <div className="scan-core" aria-hidden="true">
                  <span className="scan-ring" />
                  <span className="scan-ring" />
                  <img src={`${import.meta.env.BASE_URL}mark.svg`} alt="" width="40" height="40" />
                </div>
                <div className="hud-meters">
                  <div className="hud-meter">
                    <label>Search</label>
                    <span />
                  </div>
                  <div className="hud-meter">
                    <label>Score</label>
                    <span />
                  </div>
                  <div className="hud-meter">
                    <label>Reason</label>
                    <span />
                  </div>
                </div>
              </div>
            )}

            {phase === 2 && (
              <div className="jarvis-output">
                {DEMO_MATCHES.map((m) => (
                  <article key={m.title} className="jarvis-match">
                    <div className="demo-match-top">
                      <h4>{m.title}</h4>
                      <span className="score-pill">{m.score}%</span>
                    </div>
                    <p>{m.reason}</p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="jarvis-log">
            <p className="jarvis-caption">System log</p>
            <div className="jarvis-log-lines">
              {logs.map((line, idx) => (
                <p key={`${phase}-${idx}`}>{line}</p>
              ))}
              <span className="log-cursor" aria-hidden="true" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
