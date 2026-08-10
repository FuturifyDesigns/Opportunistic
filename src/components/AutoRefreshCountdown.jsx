import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const pad = (n) => String(n).padStart(2, '0')

function splitRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

/**
 * Live countdown to the next automatic web scan. Matching is never triggered by
 * hand, so this both shows the wait and fires `onDue` the moment it runs out.
 */
export default function AutoRefreshCountdown({ nextAt, intervalMs, running = false, onDue }) {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => Date.now())
  const firedFor = useRef(null)
  const onDueRef = useRef(onDue)

  useEffect(() => {
    onDueRef.current = onDue
  }, [onDue])

  const tick = useCallback(() => setNow(Date.now()), [])

  useEffect(() => {
    const id = window.setInterval(tick, 1000)
    // Background tabs throttle timers, so resync the instant the user comes back.
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [tick])

  const target = nextAt ?? null
  const remaining = target ? target - now : 0
  const due = !target || remaining <= 0

  // Fires once per scheduled slot; a finished scan moves the target forward,
  // which arms the next one without any retry loop if this attempt failed.
  useEffect(() => {
    if (running || !due) return
    const key = target ?? 'immediate'
    if (firedFor.current === key) return
    firedFor.current = key
    onDueRef.current?.()
  }, [due, running, target])

  const { days, hours, minutes, seconds } = splitRemaining(remaining)
  const progress =
    target && intervalMs ? Math.min(1, Math.max(0, 1 - remaining / intervalMs)) : 1

  const scheduledLabel = target
    ? new Date(target).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null

  const status = running
    ? t('dashboard.autoRefreshRunning')
    : due
      ? t('dashboard.autoRefreshDue')
      : t('dashboard.autoRefreshScheduled', { when: scheduledLabel })

  return (
    <section
      className={`dash-countdown${running ? ' is-running' : ''}`}
      aria-label={t('dashboard.autoRefreshLabel')}
    >
      <header className="dash-countdown-head">
        <span className={`dash-countdown-dot${running || due ? ' pulse' : ''}`} aria-hidden="true" />
        <p className="dash-countdown-label">{t('dashboard.autoRefreshLabel')}</p>
      </header>

      {running || due ? (
        <p className="dash-countdown-live">{t('dashboard.autoRefreshDue')}</p>
      ) : (
        <div className="dash-countdown-units" role="timer" aria-live="off">
          <span className="dash-countdown-unit">
            <strong>{days}</strong>
            <em>{t('dashboard.unitDays')}</em>
          </span>
          <span className="dash-countdown-sep" aria-hidden="true">
            :
          </span>
          <span className="dash-countdown-unit">
            <strong>{pad(hours)}</strong>
            <em>{t('dashboard.unitHours')}</em>
          </span>
          <span className="dash-countdown-sep" aria-hidden="true">
            :
          </span>
          <span className="dash-countdown-unit">
            <strong>{pad(minutes)}</strong>
            <em>{t('dashboard.unitMinutes')}</em>
          </span>
          <span className="dash-countdown-sep" aria-hidden="true">
            :
          </span>
          <span className="dash-countdown-unit">
            <strong>{pad(seconds)}</strong>
            <em>{t('dashboard.unitSeconds')}</em>
          </span>
        </div>
      )}

      <div className="dash-countdown-bar" aria-hidden="true">
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      <p className="dash-countdown-hint">{status}</p>
    </section>
  )
}
