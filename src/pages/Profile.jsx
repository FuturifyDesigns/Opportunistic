import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { COUNTRIES } from '../lib/countries'
import { supabase } from '../lib/supabase'
import { runMatchingForUser } from '../lib/matchingService'
import { useAuth } from '../context/AuthContext'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

const emptyQual = { type: 'degree', field: '', institution: '', year: new Date().getFullYear() }
const emptySkill = { skill_name: '', proficiency: 'intermediate' }

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    headline: '',
    bio: '',
    country: 'Botswana',
  })
  const [qualifications, setQualifications] = useState([{ ...emptyQual }])
  const [skills, setSkills] = useState([{ ...emptySkill }])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    document.title = 'Profile — Opportunistic'
    async function load() {
      if (profile) {
        setForm({
          full_name: profile.full_name || '',
          headline: profile.headline || '',
          bio: profile.bio || '',
          country: profile.country || 'Botswana',
        })
      }
      const [{ data: q }, { data: s }] = await Promise.all([
        supabase.from('qualifications').select('*').eq('user_id', user.id),
        supabase.from('skills').select('*').eq('user_id', user.id),
      ])
      if (q?.length) setQualifications(q)
      if (s?.length) setSkills(s)
    }
    load()
  }, [profile, user.id])

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const { error: pErr } = await supabase
        .from('profiles')
        .update({ ...form, onboarding_complete: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
      if (pErr) throw pErr

      await supabase.from('qualifications').delete().eq('user_id', user.id)
      await supabase.from('skills').delete().eq('user_id', user.id)

      const qualRows = qualifications
        .filter((q) => q.field?.trim())
        .map((q) => ({
          user_id: user.id,
          type: q.type,
          field: q.field.trim(),
          institution: q.institution?.trim() || null,
          year: Number(q.year) || null,
        }))
      const skillRows = skills
        .filter((s) => s.skill_name?.trim())
        .map((s) => ({
          user_id: user.id,
          skill_name: s.skill_name.trim(),
          proficiency: s.proficiency || 'intermediate',
        }))

      if (qualRows.length) await supabase.from('qualifications').insert(qualRows)
      if (skillRows.length) await supabase.from('skills').insert(skillRows)

      await runMatchingForUser(user.id)
      await refreshProfile()
      setMessage('Profile saved. Matches refreshed.')
      setTimeout(() => navigate('/dashboard'), 700)
    } catch (err) {
      setMessage(err.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <SiteHeader />
      <main className="container narrow">
        <p className="eyebrow">Profile</p>
        <h1>Edit your profile</h1>
        <p className="muted">Saving re-runs matching for scholarships and jobs.</p>

        <form className="stack-form" onSubmit={save}>
          <label>
            Full name
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </label>
          <label>
            Headline
            <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
          </label>
          <label>
            Bio
            <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </label>
          <label>
            Country
            <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <h2 className="form-section">Qualifications</h2>
          {qualifications.map((q, i) => (
            <div className="card-lite" key={i}>
              <label>
                Type
                <select
                  value={q.type}
                  onChange={(e) =>
                    setQualifications((rows) => rows.map((row, idx) => (idx === i ? { ...row, type: e.target.value } : row)))
                  }
                >
                  <option value="degree">Degree</option>
                  <option value="certificate">Certificate</option>
                </select>
              </label>
              <label>
                Field
                <input
                  value={q.field || ''}
                  onChange={(e) =>
                    setQualifications((rows) => rows.map((row, idx) => (idx === i ? { ...row, field: e.target.value } : row)))
                  }
                />
              </label>
              <label>
                Institution
                <input
                  value={q.institution || ''}
                  onChange={(e) =>
                    setQualifications((rows) =>
                      rows.map((row, idx) => (idx === i ? { ...row, institution: e.target.value } : row)),
                    )
                  }
                />
              </label>
              <label>
                Year
                <input
                  type="number"
                  value={q.year || ''}
                  onChange={(e) =>
                    setQualifications((rows) => rows.map((row, idx) => (idx === i ? { ...row, year: e.target.value } : row)))
                  }
                />
              </label>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => setQualifications((r) => [...r, { ...emptyQual }])}>
            Add qualification
          </button>

          <h2 className="form-section">Skills</h2>
          {skills.map((s, i) => (
            <div className="card-lite" key={i}>
              <label>
                Skill
                <input
                  value={s.skill_name || ''}
                  onChange={(e) =>
                    setSkills((rows) => rows.map((row, idx) => (idx === i ? { ...row, skill_name: e.target.value } : row)))
                  }
                />
              </label>
              <label>
                Proficiency
                <select
                  value={s.proficiency || 'intermediate'}
                  onChange={(e) =>
                    setSkills((rows) => rows.map((row, idx) => (idx === i ? { ...row, proficiency: e.target.value } : row)))
                  }
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </label>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => setSkills((r) => [...r, { ...emptySkill }])}>
            Add skill
          </button>

          {message ? <p className="form-message">{message}</p> : null}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Saving & matching…' : 'Save & rematch'}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  )
}
