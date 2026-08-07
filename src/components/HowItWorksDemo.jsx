import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

const STEPS = [
  {
    id: 'profile',
    label: '1 · Profile',
    title: 'You build a living profile',
    copy: 'Country, degrees, certificates, and skills — step by step, not one endless form.',
  },
  {
    id: 'search',
    label: '2 · Match',
    title: 'We search with your story',
    copy: 'Queries are built from your real qualifications — scholarships worldwide, jobs by country.',
  },
  {
    id: 'reason',
    label: '3 · Reason',
    title: 'Every card explains the fit',
    copy: 'Match scores and one-line reasoning stay visible — never hidden behind a click.',
  },
]

const DEMO_MATCHES = [
  {
    title: 'Mastercard Foundation Scholars',
    score: 94,
    reason: 'Matches your BSc Computer Science + Southern Africa eligibility.',
  },
  {
    title: 'React developer roles — LinkedIn',
    score: 88,
    reason: 'Aligned with React + 2 yrs experience; filtered to your country.',
  },
  {
    title: 'Chevening Scholarships',
    score: 81,
    reason: 'Fits postgraduate path and Commonwealth applicant profile.',
  },
]

export default function HowItWorksDemo() {
  const root = useRef(null)
  const [step, setStep] = useState(0)
  const auto = useRef(true)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const ctx = gsap.context(() => {
        gsap.from('.demo-shell', { opacity: 0, y: 24, duration: 0.6, ease: 'power2.out' })
      }, root)
      return () => ctx.revert()
    },
    { scope: root },
  )

  useEffect(() => {
    if (prefersReducedMotion() || !auto.current) return undefined
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length)
    }, 3800)
    return () => window.clearInterval(id)
  }, [])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      tl.fromTo(
        '.demo-stage-panel',
        { opacity: 0, x: step % 2 === 0 ? -28 : 28 },
        { opacity: 1, x: 0, duration: 0.45 },
      )

      if (step === 0) {
        tl.fromTo(
          '.demo-chip',
          { opacity: 0, scale: 0.85, y: 10 },
          { opacity: 1, scale: 1, y: 0, stagger: 0.08, duration: 0.35 },
          '-=0.1',
        )
      }
      if (step === 1) {
        tl.fromTo(
          '.demo-pulse',
          { scale: 0.6, opacity: 0.2 },
          { scale: 1.15, opacity: 0, duration: 1.1, repeat: 1 },
          0.1,
        )
        tl.fromTo('.demo-query', { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.1 }, 0.15)
      }
      if (step === 2) {
        tl.fromTo(
          '.demo-match',
          { opacity: 0, x: 40, rotateZ: 2 },
          { opacity: 1, x: 0, rotateZ: 0, stagger: 0.12, duration: 0.45 },
          0.05,
        )
        tl.fromTo(
          '.demo-score',
          { scale: 0.7, opacity: 0 },
          { scale: 1, opacity: 1, stagger: 0.1, duration: 0.35, ease: 'back.out(1.6)' },
          0.2,
        )
      }
    },
    { scope: root, dependencies: [step], revertOnUpdate: true },
  )

  return (
    <div ref={root} className="how-demo">
      <div className="demo-steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`demo-step ${i === step ? 'active' : ''}`}
            onClick={() => {
              auto.current = false
              setStep(i)
            }}
          >
            <span>{s.label}</span>
            <strong>{s.title}</strong>
            <p>{s.copy}</p>
          </button>
        ))}
      </div>

      <div className="demo-shell" aria-live="polite">
        <div className="demo-stage-panel">
          {step === 0 && (
            <div className="demo-profile">
              <p className="eyebrow">Example profile</p>
              <h3>Thabo · Botswana</h3>
              <p className="muted">BSc Computer Science · seeking scholarships & junior roles</p>
              <div className="demo-chips">
                {['Degree · CS', 'React', 'Intermediate', 'Gaborone', 'Certificate · AWS'].map((c) => (
                  <span key={c} className="demo-chip">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="demo-search">
              <div className="demo-radar">
                <span className="demo-pulse" />
                <span className="demo-pulse" />
                <img src={`${import.meta.env.BASE_URL}mark.svg`} alt="" width="48" height="48" />
              </div>
              <div className="demo-queries">
                <p className="demo-query">“computer science scholarships Southern Africa 2026”</p>
                <p className="demo-query">“React developer entry level jobs Botswana”</p>
                <p className="demo-query">Scoring candidates… writing reasons…</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="demo-matches">
              {DEMO_MATCHES.map((m) => (
                <article key={m.title} className="demo-match">
                  <div className="demo-match-top">
                    <h4>{m.title}</h4>
                    <span className="demo-score score-pill">{m.score}%</span>
                  </div>
                  <p>{m.reason}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
