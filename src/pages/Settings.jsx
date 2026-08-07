import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { COUNTRIES } from '../lib/countries'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { openCookiePreferences } from '../lib/consent'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [digest, setDigest] = useState('weekly')
  const [country, setCountry] = useState('Botswana')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = t('settings.docTitle')
    if (profile) {
      setDigest(profile.digest_frequency || 'weekly')
      setCountry(profile.country || 'Botswana')
    }
  }, [profile, t])

  async function save() {
    setBusy(true)
    setMessage('')
    const { error } = await supabase
      .from('profiles')
      .update({ digest_frequency: digest, country })
      .eq('user_id', user.id)
    setBusy(false)
    if (error) setMessage(error.message)
    else {
      setMessage(t('settings.saved'))
      refreshProfile()
    }
  }

  async function deleteAccount() {
    if (!window.confirm(t('settings.deleteConfirm'))) return
    setBusy(true)
    await Promise.all([
      supabase.from('scholarship_matches').delete().eq('user_id', user.id),
      supabase.from('job_matches').delete().eq('user_id', user.id),
      supabase.from('qualifications').delete().eq('user_id', user.id),
      supabase.from('skills').delete().eq('user_id', user.id),
      supabase.from('search_runs').delete().eq('user_id', user.id),
      supabase.from('profiles').delete().eq('user_id', user.id),
    ])
    setMessage(t('settings.deleted'))
    await signOut()
    navigate('/')
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

          {message ? <p className="form-message">{message}</p> : null}
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
