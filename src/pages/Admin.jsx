import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { fetchAdminOverview } from '../lib/analytics'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

function Stat({ label, value, hint }) {
  return (
    <article className="admin-stat">
      <p className="admin-stat-label">{label}</p>
      <p className="admin-stat-value">{value ?? '—'}</p>
      {hint ? <p className="admin-stat-hint muted">{hint}</p> : null}
    </article>
  )
}

function formatTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return String(iso)
  }
}

function BarList({ rows, labelKey, valueKey }) {
  const max = Math.max(1, ...(rows || []).map((r) => Number(r[valueKey]) || 0))
  if (!rows?.length) return <p className="muted">No data yet.</p>
  return (
    <ul className="admin-bar-list">
      {rows.map((row) => {
        const v = Number(row[valueKey]) || 0
        return (
          <li key={`${row[labelKey]}-${v}`}>
            <div className="admin-bar-meta">
              <span>{row[labelKey] || '—'}</span>
              <strong>{v}</strong>
            </div>
            <div className="admin-bar-track" aria-hidden="true">
              <span style={{ width: `${Math.max(4, (v / max) * 100)}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default function Admin() {
  const { t, i18n } = useTranslation()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [liveFlash, setLiveFlash] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAdminOverview()
      setStats(data)
      setError('')
    } catch (err) {
      setError(err?.message || 'Could not load admin stats. Apply the analytics migration in Supabase.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = `Admin — ${t('common.brand')}`
  }, [t, i18n.language])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Realtime: any engagement write refreshes the overview immediately
  useEffect(() => {
    const pulse = () => {
      setLiveFlash(true)
      window.setTimeout(() => setLiveFlash(false), 600)
      refresh()
    }

    const channel = supabase
      .channel('admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'analytics_events' }, pulse)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, pulse)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scholarship_matches' }, pulse)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_matches' }, pulse)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'search_runs' }, pulse)
      .subscribe()

    const poll = window.setInterval(refresh, 20000)

    return () => {
      window.clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [refresh])

  const daily = useMemo(() => stats?.daily_active_14d || [], [stats])
  const maxDaily = Math.max(1, ...daily.map((d) => Number(d.active) || 0))

  return (
    <div className="page admin-page">
      <SiteHeader />
      <main className="container admin-main">
        <div className="admin-head">
          <div>
            <p className="eyebrow">Private · real-time</p>
            <h1 className="gt-heading">Site admin</h1>
            <p className="lede">
              Live users, frequency, and engagement across Opportunistic. Updates as people use the
              site.
            </p>
          </div>
          <div className={`admin-live-pill ${liveFlash ? 'flash' : ''}`.trim()}>
            <span className="admin-live-dot" />
            Live
          </div>
        </div>

        {error ? (
          <div className="admin-banner error" role="alert">
            <p>{error}</p>
            <p className="muted">
              Run <code>supabase/migrations/004_analytics_admin.sql</code> in the Supabase SQL
              editor, then refresh.
            </p>
          </div>
        ) : null}

        {loading && !stats ? (
          <div className="page-center">
            <div className="spinner" aria-label={t('common.loading')} />
          </div>
        ) : (
          <>
            <section className="admin-stat-grid" aria-label="Overview">
              <Stat label="Total users" value={stats?.users_total} hint="All profiles" />
              <Stat label="Onboarded" value={stats?.users_onboarded} hint="Finished setup" />
              <Stat label="Active now" value={stats?.active_now} hint="Last 5 minutes" />
              <Stat label="Active today" value={stats?.active_today} hint="Unique visitors" />
              <Stat label="Active 7 days" value={stats?.active_7d} hint="Unique visitors" />
              <Stat label="New users today" value={stats?.users_today} />
              <Stat label="Page views today" value={stats?.page_views_today} />
              <Stat label="Page views 7d" value={stats?.page_views_7d} />
              <Stat label="Matches stored" value={stats?.matches_total} />
              <Stat label="Saves" value={stats?.saves_total} hint="Jobs + scholarships" />
              <Stat label="Dismisses" value={stats?.dismisses_total} />
              <Stat label="Rematches 7d" value={stats?.search_runs_7d} hint="Search runs" />
            </section>

            <div className="admin-panels">
              <section className="admin-panel">
                <h2>Daily active (14 days)</h2>
                <div className="admin-spark" role="img" aria-label="Daily active users chart">
                  {daily.length ? (
                    daily.map((d) => (
                      <div key={d.day} className="admin-spark-col" title={`${d.day}: ${d.active}`}>
                        <span
                          style={{ height: `${Math.max(6, ((Number(d.active) || 0) / maxDaily) * 100)}%` }}
                        />
                        <em>{String(d.day).slice(5)}</em>
                      </div>
                    ))
                  ) : (
                    <p className="muted">Waiting for traffic…</p>
                  )}
                </div>
              </section>

              <section className="admin-panel">
                <h2>Top pages (7 days)</h2>
                <BarList rows={stats?.top_paths || []} labelKey="path" valueKey="views" />
              </section>

              <section className="admin-panel">
                <h2>Event mix (7 days)</h2>
                <BarList rows={stats?.events_by_type_7d || []} labelKey="event_type" valueKey="count" />
              </section>

              <section className="admin-panel admin-panel-wide">
                <h2>Live activity feed</h2>
                <div className="admin-feed">
                  {(stats?.recent_events || []).length ? (
                    <table>
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Event</th>
                          <th>Path</th>
                          <th>Session</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recent_events.map((ev) => (
                          <tr key={ev.id}>
                            <td>{formatTime(ev.created_at)}</td>
                            <td>
                              <code>{ev.event_type}</code>
                              {ev.meta?.action ? <span className="muted"> · {ev.meta.action}</span> : null}
                            </td>
                            <td>{ev.path || '—'}</td>
                            <td className="mono-tiny">{String(ev.session_id || '').slice(0, 8)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="muted">No events yet — browse the site to generate telemetry.</p>
                  )}
                </div>
                <p className="muted admin-updated">
                  Snapshot {stats?.generated_at ? formatTime(stats.generated_at) : '—'} · auto-refreshes
                  on every change
                </p>
              </section>
            </div>
          </>
        )}

        <p className="admin-back">
          <Link to="/dashboard">← Back to dashboard</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
