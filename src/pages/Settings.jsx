import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { COUNTRIES } from '../lib/countries'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { openCookiePreferences } from '../lib/consent'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [digest, setDigest] = useState('weekly')
  const [country, setCountry] = useState('Botswana')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Settings — Opportunistic'
    if (profile) {
      setDigest(profile.digest_frequency || 'weekly')
      setCountry(profile.country || 'Botswana')
    }
  }, [profile])

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
      setMessage('Settings saved.')
      refreshProfile()
    }
  }

  async function deleteAccount() {
    if (!window.confirm('Delete your account and all matches permanently?')) return
    setBusy(true)
    // Client can delete profile cascade via RPC; without service role we delete owned rows then sign out.
    await Promise.all([
      supabase.from('scholarship_matches').delete().eq('user_id', user.id),
      supabase.from('job_matches').delete().eq('user_id', user.id),
      supabase.from('qualifications').delete().eq('user_id', user.id),
      supabase.from('skills').delete().eq('user_id', user.id),
      supabase.from('search_runs').delete().eq('user_id', user.id),
      supabase.from('profiles').delete().eq('user_id', user.id),
    ])
    setMessage('Your data was removed from the app. Contact support if you also need the auth account purged.')
    await signOut()
    navigate('/')
  }

  return (
    <div className="page">
      <SiteHeader />
      <main className="container narrow">
        <p className="eyebrow">Settings</p>
        <h1>Account settings</h1>

        <div className="stack-form">
          <label>
            Email digest frequency
            <select value={digest} onChange={(e) => setDigest(e.target.value)}>
              <option value="off">Off</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <p className="muted">Digests will send via Brevo once email is connected. Unsubscribe is always included.</p>

          <label>
            Country
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          {message ? <p className="form-message">{message}</p> : null}
          <button type="button" className="btn" disabled={busy} onClick={save}>
            Save settings
          </button>

          <hr className="divider" />

          <h2 className="form-section">Privacy & cookies</h2>
          <p className="muted">
            Manage optional cookies anytime. Necessary cookies stay on for security and to remember this choice.
          </p>
          <button type="button" className="btn btn-ghost" onClick={() => openCookiePreferences()}>
            Cookie settings
          </button>

          <hr className="divider" />

          <h2 className="form-section">Danger zone</h2>
          <p className="muted">Account deletion removes your profile, qualifications, skills, and matches (cascade).</p>
          <button type="button" className="btn btn-danger" disabled={busy} onClick={deleteAccount}>
            Delete my data
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
