import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

export default function LaneControl() {
  const root = useRef(null)
  const portalRef = useRef(null)
  const logRef = useRef(null)
  const runId = useRef(0)
  const { t, i18n } = useTranslation()

  const [phase, setPhase] = useState('boot')
  const [logs, setLogs] = useState([])
  const [activeChip, setActiveChip] = useState('cs')
  const [visibleMatches, setVisibleMatches] = useState([])
  const [scanning, setScanning] = useState(false)

  const chips = useMemo(
    () => [
      { id: 'cs', label: t('landing.sim.chipCs') },
      { id: 'remote', label: t('landing.sim.chipRemote') },
      { id: 'botswana', label: t('landing.sim.chipBotswana') },
    ],
    [t, i18n.language],
  )

  const matchSets = useMemo(
    () => ({
      cs: [
        {
          kind: t('landing.scholarship'),
          title: t('landing.sim.matchCs1Title'),
          score: 94,
          reason: t('landing.sim.matchCs1Reason'),
        },
        {
          kind: t('landing.job'),
          title: t('landing.sim.matchCs2Title'),
          score: 89,
          reason: t('landing.sim.matchCs2Reason'),
        },
        {
          kind: t('landing.scholarship'),
          title: t('landing.sim.matchCs3Title'),
          score: 82,
          reason: t('landing.sim.matchCs3Reason'),
        },
      ],
      remote: [
        {
          kind: t('landing.job'),
          title: t('landing.sim.matchRemote1Title'),
          score: 91,
          reason: t('landing.sim.matchRemote1Reason'),
        },
        {
          kind: t('landing.job'),
          title: t('landing.sim.matchRemote2Title'),
          score: 86,
          reason: t('landing.sim.matchRemote2Reason'),
        },
        {
          kind: t('landing.scholarship'),
          title: t('landing.sim.matchRemote3Title'),
          score: 79,
          reason: t('landing.sim.matchRemote3Reason'),
        },
      ],
      botswana: [
        {
          kind: t('landing.scholarship'),
          title: t('landing.sim.matchBw1Title'),
          score: 96,
          reason: t('landing.sim.matchBw1Reason'),
        },
        {
          kind: t('landing.job'),
          title: t('landing.sim.matchBw2Title'),
          score: 88,
          reason: t('landing.sim.matchBw2Reason'),
        },
        {
          kind: t('landing.scholarship'),
          title: t('landing.sim.matchBw3Title'),
          score: 84,
          reason: t('landing.sim.matchBw3Reason'),
        },
      ],
    }),
    [t, i18n.language],
  )

  const phaseLabel = useMemo(() => {
    const map = {
      boot: t('landing.sim.phaseBoot'),
      lock: t('landing.sim.phaseLock'),
      scan: t('landing.sim.phaseScan'),
      match: t('landing.sim.phaseMatch'),
      idle: t('landing.sim.phaseIdle'),
    }
    return map[phase] || map.idle
  }, [phase, t, i18n.language])

  const pushLogs = useCallback((lines, { instant = false } = {}) => {
    if (instant || prefersReducedMotion()) {
      setLogs(lines)
      return () => {}
    }
    setLogs([])
    let i = 0
    const id = window.setInterval(() => {
      setLogs((prev) => [...prev, lines[i]])
      i += 1
      if (i >= lines.length) window.clearInterval(id)
    }, 380)
    return () => window.clearInterval(id)
  }, [])

  const runSequence = useCallback(
    (chipId) => {
      const id = ++runId.current
      const reduced = prefersReducedMotion()
      const matches = matchSets[chipId] || matchSets.cs
      setActiveChip(chipId)
      setVisibleMatches([])
      setScanning(true)

      const bootLines = [
        t('landing.sim.logBoot1'),
        t('landing.sim.logBoot2'),
        t('landing.sim.logBoot3'),
      ]
      const lockLines = [
        t('landing.sim.logLock1', { chip: chips.find((c) => c.id === chipId)?.label || chipId }),
        t('landing.sim.logLock2'),
        t('landing.sim.logLock3'),
      ]
      const scanLines = [
        t('landing.sim.logScan1'),
        t('landing.sim.logScan2'),
        t('landing.sim.logScan3'),
      ]
      const matchLines = [
        t('landing.sim.logMatch1', { count: matches.length }),
        t('landing.sim.logMatch2'),
        t('landing.sim.logMatch3'),
      ]

      if (reduced) {
        setPhase('idle')
        setLogs([...bootLines, ...lockLines, ...scanLines, ...matchLines])
        setVisibleMatches(matches)
        setScanning(false)
        return
      }

      const timers = []
      const later = (fn, ms) => {
        timers.push(window.setTimeout(fn, ms))
      }

      setPhase('boot')
      let clearBoot = pushLogs(bootLines)

      later(() => {
        if (runId.current !== id) return
        clearBoot?.()
        setPhase('lock')
        clearBoot = pushLogs(lockLines)
      }, 1400)

      later(() => {
        if (runId.current !== id) return
        clearBoot?.()
        setPhase('scan')
        clearBoot = pushLogs(scanLines)
      }, 2800)

      later(() => {
        if (runId.current !== id) return
        clearBoot?.()
        setPhase('match')
        clearBoot = pushLogs(matchLines)
        setVisibleMatches(matches)
      }, 4400)

      later(() => {
        if (runId.current !== id) return
        clearBoot?.()
        setPhase('idle')
        setScanning(false)
      }, 5600)

      return () => {
        timers.forEach((timer) => window.clearTimeout(timer))
        clearBoot?.()
      }
    },
    [chips, matchSets, pushLogs, t],
  )

  useEffect(() => {
    const cleanup = runSequence('cs')
    return () => cleanup?.()
  }, [runSequence])

  useEffect(() => {
    const el = logRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [logs])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      const portal = portalRef.current
      if (!portal) return

      const onMove = (e) => {
        const rect = root.current?.getBoundingClientRect()
        if (!rect) return
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        gsap.to(portal, {
          x: x * 14,
          y: y * 10,
          duration: 0.6,
          ease: 'power2.out',
          overwrite: 'auto',
        })
        gsap.to('.lane-orbit', {
          x: x * 8,
          y: y * 6,
          duration: 0.7,
          ease: 'power2.out',
          overwrite: 'auto',
        })
      }

      const onLeave = () => {
        gsap.to([portal, '.lane-orbit'], { x: 0, y: 0, duration: 0.7, ease: 'power2.out' })
      }

      const node = root.current
      node?.addEventListener('pointermove', onMove)
      node?.addEventListener('pointerleave', onLeave)
      return () => {
        node?.removeEventListener('pointermove', onMove)
        node?.removeEventListener('pointerleave', onLeave)
      }
    },
    { scope: root },
  )

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      if (phase === 'boot') {
        gsap.fromTo(
          '.lane-portal-mark',
          { scale: 0.86, opacity: 0.35 },
          { scale: 1, opacity: 1, duration: 0.85, ease: 'power2.out' },
        )
        gsap.fromTo(
          '.lane-ring',
          { scale: 0.75, opacity: 0 },
          { scale: 1, opacity: 1, stagger: 0.12, duration: 0.7, ease: 'power2.out' },
        )
      }
      if (phase === 'scan') {
        gsap.fromTo(
          '.lane-sweep',
          { rotate: -20, opacity: 0 },
          { rotate: 200, opacity: 0.55, duration: 1.6, ease: 'sine.inOut', repeat: 1, yoyo: true },
        )
        gsap.fromTo(
          '.lane-node',
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, stagger: 0.08, duration: 0.4, ease: 'back.out(1.6)' },
        )
      }
      if (phase === 'match' || (phase === 'idle' && visibleMatches.length)) {
        gsap.fromTo(
          '.lane-match',
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.12, duration: 0.45, ease: 'power2.out' },
        )
      }
    },
    { scope: root, dependencies: [phase, visibleMatches], revertOnUpdate: true },
  )

  return (
    <div ref={root} className={`lane-control phase-${phase}${scanning ? ' is-scanning' : ''}`}>
      <div className="lane-stage" aria-hidden={false}>
        <div className="lane-orbit" aria-hidden="true">
          <span className="lane-ring r1" />
          <span className="lane-ring r2" />
          <span className="lane-ring r3" />
          <span className="lane-sweep" />
          <span className="lane-node n1" />
          <span className="lane-node n2" />
          <span className="lane-node n3" />
          <span className="lane-node n4" />
        </div>

        <div className="lane-portal" ref={portalRef}>
          <div className="lane-portal-core">
            <img
              className="lane-portal-mark"
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt=""
              width="120"
              height="120"
            />
            <span className="lane-path" aria-hidden="true" />
          </div>
          <p className="lane-status">
            <span className="lane-status-dot" />
            {phaseLabel}
          </p>
        </div>

        <div className="lane-matches" aria-live="polite">
          {visibleMatches.map((m) => (
            <article key={`${activeChip}-${m.title}`} className="lane-match">
              <div className="lane-match-top">
                <span className="lane-match-kind">{m.kind}</span>
                <span className="score-pill">{m.score}%</span>
              </div>
              <strong>{m.title}</strong>
              <p>{m.reason}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="lane-console">
        <div className="lane-console-chrome">
          <p className="lane-console-title">{t('landing.sim.consoleTitle')}</p>
          <p className="lane-console-meta">{t('landing.sim.consoleMeta')}</p>
        </div>
        <div className="lane-log" ref={logRef} aria-live="polite">
          {logs.map((line, idx) => (
            <p key={`${idx}-${line}`}>{line}</p>
          ))}
          <span className="log-cursor" aria-hidden="true" />
        </div>
        <div className="lane-chips" role="group" aria-label={t('landing.sim.chipsAria')}>
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={`lane-chip ${activeChip === chip.id ? 'active' : ''}`}
              disabled={scanning}
              onClick={() => runSequence(chip.id)}
            >
              {chip.label}
            </button>
          ))}
          <button
            type="button"
            className="lane-chip lane-chip-rerun"
            disabled={scanning}
            onClick={() => runSequence(activeChip)}
          >
            {t('landing.sim.rerun')}
          </button>
        </div>
      </div>
    </div>
  )
}
