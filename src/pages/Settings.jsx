import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { COUNTRIES } from '../lib/countries'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { openCookiePreferences } from '../lib/consent'
import { normalizeGoal, resolveGoal, updateProfile, withGoalTag, stripGoalTag } from '../lib/goal'
import { runMatchingForUser } from '../lib/matchingService'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const toast = useToast()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [digest, setDigest] = useState('weekly')
  const [country, setCountry] = useState('Botswana')
  const [goal, setGoal] = useState('both')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = t('settings.docTitle')
    if (profile) {
      setDigest(profile.digest_frequency || 'weekly')
      setCountry(profile.country || 'Botswana')
      setGoal(resolveGoal(profile))
    }
  }, [profile, t])

  async function save() {
    setBusy(true)
    const focus = normalizeGoal(goal)
    const bio = withGoalTag(stripGoalTag(profile?.bio || ''), focus)
    const { error } = await updateProfile(supabase, user.id, {
      digest_frequency: digest,
      country,
      goal: focus,
      bio,
    })
    if (error) {
      setBusy(false)
      toast.error(error.message || t('common.toast.genericError'))
      return
    }
    try {
      localStorage.setItem(`opp_goal_${user.id}`, focus)
    } catch {
      /* ignore */
    }
    try {
      await runMatchingForUser(user.id)
    } catch {
      /* rematch best-effort */
    }
    setBusy(false)
    toast.success(t('settings.saved'))
    refreshProfile()
  }

  async function deleteAccount() {
    if (!window.confirm(t('settings.deleteConfirm'))) return
    setBusy(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const base = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (token && base && anon) {
        const res = await fetch(`${base}/functions/v1/delete-account`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: anon,
            'Content-Type': 'application/json',
          },
          body: '{}',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          // Fall back to client-side wipe if the function is not deployed yet
          if (res.status !== 404) throw new Error(json.error || t('settings.deleteFailed'))
          await Promise.all([
            supabase.from('scholarship_matches').delete().eq('user_id', user.id),
            supabase.from('job_matches').delete().eq('user_id', user.id),
            supabase.from('qualifications').delete().eq('user_id', user.id),
            supabase.from('skills').delete().eq('user_id', user.id),
            supabase.from('search_runs').delete().eq('user_id', user.id),
            supabase.from('profiles').delete().eq('user_id', user.id),
          ])
        }
      } else {
        await Promise.all([
          supabase.from('scholarship_matches').delete().eq('user_id', user.id),
          supabase.from('job_matches').delete().eq('user_id', user.id),
          supabase.from('qualifications').delete().eq('user_id', user.id),
          supabase.from('skills').delete().eq('user_id', user.id),
          supabase.from('search_runs').delete().eq('user_id', user.id),
          supabase.from('profiles').delete().eq('user_id', user.id),
        ])
      }

      toast.success(t('settings.deleted'))
      await signOut()
      navigate('/home')
    } catch (err) {
      toast.error(err.message || t('common.toast.genericError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <SiteHeader />
      <main className="container narrow">
        <p className="eyebrow">{t('nav.settings')}</p>
        <h1>{t('settings.title')}</h1>

        <div className="stack-form">
          <label>
            {t('common.language')}
            <div className="settings-lang">
              <LanguageSwitcher />
            </div>
          </label>

          <label>
            {t('settings.emailDigest')}
            <select value={digest} onChange={(e) => setDigest(e.target.value)}>
              <option value="off">{t('settings.digestOff')}</option>
              <option value="weekly">{t('settings.digestWeekly')}</option>
              <option value="monthly">{t('settings.digestMonthly')}</option>
            </select>
          </label>

          <label>
            {i18n.exists('settings.country') ? t('settings.country') : t('profile.country')}
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="settings-goal-label">{t('settings.goal')}</span>
            <div className="choice-pills" role="group" aria-label={t('onboarding.goalAria')}>
              {[
                ['both', t('onboarding.goalBoth')],
                ['scholarships', t('onboarding.goalScholarships')],
                ['jobs', t('onboarding.goalJobs')],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`choice-pill ${goal === value ? 'active' : ''}`}
                  aria-pressed={goal === value}
                  onClick={() => setGoal(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="muted">{t('settings.goalHint')}</p>
          </div>

          <button type="button" className="btn" disabled={busy} onClick={save}>
            {t('settings.saveSettings')}
          </button>

          <hr className="divider" />

          <h2 className="form-section">{t('settings.privacyCookies')}</h2>
          <p className="muted">{t('settings.privacyCookiesBody')}</p>
          <button type="button" className="btn btn-ghost" onClick={() => openCookiePreferences()}>
            {t('nav.cookieSettings')}
          </button>

          <hr className="divider" />

          <h2 className="form-section">{t('settings.dangerZone')}</h2>
          <p className="muted">{t('settings.dangerBody')}</p>
          <button type="button" className="btn btn-danger" disabled={busy} onClick={deleteAccount}>
            {t('settings.deleteData')}
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
