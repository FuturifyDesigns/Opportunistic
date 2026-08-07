import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

export default function HowItWorksDemo() {
  const root = useRef(null)
  const { t, i18n } = useTranslation()
  const [phase, setPhase] = useState(0)
  const [logs, setLogs] = useState([])
  const auto = useRef(true)

  const PHASES = useMemo(
    () => [
      {
        id: 'ingest',
        label: t('howDemo.phaseIngestLabel'),
        title: t('howDemo.phaseIngestTitle'),
        desc: t('howDemo.phaseIngestDesc'),
      },
      {
        id: 'process',
        label: t('howDemo.phaseProcessLabel'),
        title: t('howDemo.phaseProcessTitle'),
        desc: t('howDemo.phaseProcessDesc'),
      },
      {
        id: 'output',
        label: t('howDemo.phaseOutputLabel'),
        title: t('howDemo.phaseOutputTitle'),
        desc: t('howDemo.phaseOutputDesc'),
      },
    ],
    [t, i18n.language],
  )

  const LOG_LINES = useMemo(
    () => ({
      ingest: [
        t('howDemo.logIngest1'),
        t('howDemo.logIngest2'),
        t('howDemo.logIngest3'),
        t('howDemo.logIngest4'),
        t('howDemo.logIngest5'),
      ],
      process: [
        t('howDemo.logProcess1'),
        t('howDemo.logProcess2'),
        t('howDemo.logProcess3'),
        t('howDemo.logProcess4'),
        t('howDemo.logProcess5'),
      ],
      output: [
        t('howDemo.logOutput1'),
        t('howDemo.logOutput2'),
        t('howDemo.logOutput3'),
        t('howDemo.logOutput4'),
      ],
    }),
    [t, i18n.language],
  )

  const DEMO_MATCHES = useMemo(
    () => [
      {
        title: t('howDemo.demoMatch1Title'),
        score: 94,
        reason: t('howDemo.demoMatch1Reason'),
      },
      {
        title: t('howDemo.demoMatch2Title'),
        score: 88,
        reason: t('howDemo.demoMatch2Reason'),
      },
      {
        title: t('howDemo.demoMatch3Title'),
        score: 81,
        reason: t('howDemo.demoMatch3Reason'),
      },
    ],
    [t, i18n.language],
  )

  const feedChips = useMemo(
    () => [
      t('howDemo.feedChip1'),
      t('howDemo.feedChip2'),
      t('howDemo.feedChip3'),
      t('howDemo.feedChip4'),
      t('howDemo.feedChip5'),
    ],
    [t, i18n.language],
  )

  useEffect(() => {
    if (prefersReducedMotion() || !auto.current) return undefined
    const id = window.setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 5200)
    return () => window.clearInterval(id)
  }, [PHASES.length])

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
  }, [phase, LOG_LINES, PHASES])

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
            <p>{p.desc}</p>
          </button>
        ))}
      </div>

      <div className="jarvis-screen" aria-live="polite">
        <div className="jarvis-chrome">
          <p className="jarvis-title">{t('howDemo.consoleTitle')}</p>
          <p className="jarvis-status">{PHASES[phase].label}</p>
        </div>

        <div className="jarvis-body">
          <div className="jarvis-stage">
            {phase === 0 && (
              <div className="jarvis-ingest">
                <p className="jarvis-caption">{t('howDemo.feedCaption')}</p>
                <div className="feed-chips">
                  {feedChips.map((c) => (
                    <span key={c} className="feed-chip">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="ingest-beam" aria-hidden="true" />
              </div>
            )}

            {phase === 1 && (
              <div className="jarvis-process">
                <div className="scan-core" aria-hidden="true">
                  <span className="scan-ring" />
                  <span className="scan-ring" />
                  <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width="40" height="40" />
                </div>
                <div className="hud-meters">
                  <div className="hud-meter">
                    <label>{t('howDemo.meterSearch')}</label>
                    <span />
                  </div>
                  <div className="hud-meter">
                    <label>{t('howDemo.meterScore')}</label>
                    <span />
                  </div>
                  <div className="hud-meter">
                    <label>{t('howDemo.meterReason')}</label>
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
            <p className="jarvis-caption">{t('howDemo.systemLog')}</p>
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
