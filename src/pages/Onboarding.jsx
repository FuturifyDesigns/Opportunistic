import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { COUNTRIES } from '../lib/countries'
import { supabase } from '../lib/supabase'
import { runMatchingForUser } from '../lib/matchingService'
import { useAuth } from '../context/AuthContext'
import SiteHeader from '../components/SiteHeader'

const emptyQual = { type: 'degree', field: '', institution: '', year: new Date().getFullYear() }
const emptySkill = { skill_name: '', proficiency: 'intermediate' }

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [country, setCountry] = useState('Botswana')
  const [fullName, setFullName] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [qualifications, setQualifications] = useState([{ ...emptyQual }])
  const [skills, setSkills] = useState([{ ...emptySkill }])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const steps = useMemo(() => ['Country', 'About you', 'Qualifications', 'Skills'], [])

  function updateQual(i, key, value) {
    setQualifications((rows) => rows.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)))
  }

  function updateSkill(i, key, value) {
    setSkills((rows) => rows.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)))
  }

  async function finish() {
    setBusy(true)
    setError('')
    try {
      const { error: pErr } = await supabase.from('profiles').upsert({
        user_id: user.id,
        full_name: fullName,
        headline,
        bio,
        country,
        onboarding_complete: true,
      })
      if (pErr) throw pErr

      await supabase.from('qualifications').delete().eq('user_id', user.id)
      await supabase.from('skills').delete().eq('user_id', user.id)

      const qualRows = qualifications
        .filter((q) => q.field.trim())
        .map((q) => ({
          user_id: user.id,
          type: q.type,
          field: q.field.trim(),
          institution: q.institution.trim() || null,
          year: Number(q.year) || null,
        }))
      const skillRows = skills
        .filter((s) => s.skill_name.trim())
        .map((s) => ({
          user_id: user.id,
          skill_name: s.skill_name.trim(),
          proficiency: s.proficiency,
        }))

      if (qualRows.length) {
        const { error: qErr } = await supabase.from('qualifications').insert(qualRows)
        if (qErr) throw qErr
      }
      if (skillRows.length) {
        const { error: sErr } = await supabase.from('skills').insert(skillRows)
        if (sErr) throw sErr
      }

      await runMatchingForUser(user.id)
      await refreshProfile()
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Could not save profile')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <SiteHeader />
      <main className="container narrow">
        <p className="eyebrow">Onboarding · Step {step + 1} of {steps.length}</p>
        <h1>{steps[step]}</h1>
        <div className="progress">
          <div style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        {step === 0 && (
          <div className="stack-form">
            <label>
              Where are you based?
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted">Job matches are filtered by country. Scholarships stay worldwide with regional preference.</p>
          </div>
        )}

        {step === 1 && (
          <div className="stack-form">
            <label>
              Full name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </label>
            <label>
              Headline
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. BSc CS graduate · React developer"
              />
            </label>
            <label>
              Short bio
              <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What are you aiming for?" />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="stack-form">
            {qualifications.map((q, i) => (
              <div className="card-lite" key={i}>
                <label>
                  Type
                  <select value={q.type} onChange={(e) => updateQual(i, 'type', e.target.value)}>
                    <option value="degree">Degree</option>
                    <option value="certificate">Certificate</option>
                  </select>
                </label>
                <label>
                  Field
                  <input value={q.field} onChange={(e) => updateQual(i, 'field', e.target.value)} placeholder="Computer Science" />
                </label>
                <label>
                  Institution
                  <input value={q.institution} onChange={(e) => updateQual(i, 'institution', e.target.value)} />
                </label>
                <label>
                  Year
                  <input type="number" value={q.year} onChange={(e) => updateQual(i, 'year', e.target.value)} />
                </label>
              </div>
            ))}
            <button type="button" className="btn btn-ghost" onClick={() => setQualifications((r) => [...r, { ...emptyQual }])}>
              Add another
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="stack-form">
            {skills.map((s, i) => (
              <div className="card-lite" key={i}>
                <label>
                  Skill
                  <input value={s.skill_name} onChange={(e) => updateSkill(i, 'skill_name', e.target.value)} placeholder="React" />
                </label>
                <label>
                  Proficiency
                  <select value={s.proficiency} onChange={(e) => updateSkill(i, 'proficiency', e.target.value)}>
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
          </div>
        )}

        {error ? <p className="form-message">{error}</p> : null}

        <div className="cta-row" style={{ marginTop: '1.5rem' }}>
          {step > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          ) : null}
          {step < steps.length - 1 ? (
            <button type="button" className="btn" onClick={() => setStep((s) => s + 1)}>
              Continue
            </button>
          ) : (
            <button type="button" className="btn" disabled={busy} onClick={finish}>
              {busy ? 'Matching…' : 'Finish & find matches'}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
