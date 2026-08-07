import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { COUNTRIES } from '../lib/countries'
import { supabase } from '../lib/supabase'
import { runMatchingForUser } from '../lib/matchingService'
import { useAuth } from '../context/AuthContext'
import SiteHeader from '../components/SiteHeader'
import PageBackdrop from '../components/PageBackdrop'
import { prefersReducedMotion } from '../lib/animations'

gsap.registerPlugin(useGSAP)

const emptyQual = { type: 'degree', field: '', institution: '', year: new Date().getFullYear() }
const emptySkill = { skill_name: '', proficiency: 'intermediate' }

const GUIDE = [
  {
    id: 'country',
    title: 'Where should we look for jobs?',
    tip: 'Pick the country you want job matches for. Scholarships stay worldwide, with a preference for your region.',
    why: 'Jobs are filtered by this country. Changing it later rematches automatically.',
  },
  {
    id: 'you',
    title: 'Who are you to Opportunistic?',
    tip: 'Name is required. Headline is your one-line summary — like a short bio for matching.',
    why: 'This is how matches “talk” about you in reasoning lines.',
  },
  {
    id: 'quals',
    title: 'What have you studied or earned?',
    tip: 'Add degrees or certificates. Field matters most (e.g. Computer Science). Institution and year help ranking.',
    why: 'Qualifications drive scholarship fit and career-level job matches.',
  },
  {
    id: 'skills',
    title: 'What can you do well?',
    tip: 'List skills employers or programs care about. Proficiency tells us how strongly to weight each one.',
    why: 'Skills sharpen job queries and raise match scores when they align.',
  },
  {
    id: 'process',
    title: 'Hand it to Opportunistic',
    tip: 'We’ll lock your profile, search, score, and return reasoned matches — like briefing an assistant.',
    why: 'No extra forms. When this finishes, your dashboard opens with results.',
  },
]

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const root = useRef(null)
  const [step, setStep] = useState(0)
  const [country, setCountry] = useState('Botswana')
  const [fullName, setFullName] = useState('')
  const [headline, setHeadline] = useState('')
  const [goal, setGoal] = useState('both')
  const [qualifications, setQualifications] = useState([{ ...emptyQual }])
  const [skills, setSkills] = useState([{ ...emptySkill }])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [processLogs, setProcessLogs] = useState([])

  const guide = GUIDE[step]
  const progress = ((step + 1) / GUIDE.length) * 100

  const feedPreview = useMemo(() => {
    const items = [`Country · ${country}`]
    if (fullName) items.push(`Name · ${fullName.split(' ')[0]}`)
    if (headline) items.push(`Headline · ${headline.slice(0, 28)}${headline.length > 28 ? '…' : ''}`)
    qualifications.filter((q) => q.field.trim()).forEach((q) => items.push(`${q.type} · ${q.field}`))
    skills.filter((s) => s.skill_name.trim()).forEach((s) => items.push(`Skill · ${s.skill_name}`))
    return items.slice(0, 6)
  }, [country, fullName, headline, qualifications, skills])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        '.ob-panel, .ob-assistant',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out' },
      )
    },
    { scope: root, dependencies: [step], revertOnUpdate: true },
  )

  function updateQual(i, key, value) {
    setQualifications((rows) => rows.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)))
  }

  function updateSkill(i, key, value) {
    setSkills((rows) => rows.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)))
  }

  function canContinue() {
    if (step === 0) return Boolean(country)
    if (step === 1) return fullName.trim().length >= 2
    if (step === 2) return qualifications.some((q) => q.field.trim())
    if (step === 3) return skills.some((s) => s.skill_name.trim())
    return true
  }

  async function finish() {
    setBusy(true)
    setError('')
    setProcessLogs([])
    const lines = [
      '> locking profile…',
      `> country=${country}`,
      `> qualifications=${qualifications.filter((q) => q.field.trim()).length}`,
      `> skills=${skills.filter((s) => s.skill_name.trim()).length}`,
      '> building match queries…',
      '> scoring + writing reasons…',
      '> pushing results to dashboard…',
    ]
    lines.forEach((line, i) => {
      window.setTimeout(() => setProcessLogs((prev) => [...prev, line]), i * 380)
    })

    try {
      const bio =
        goal === 'scholarships'
          ? 'Looking primarily for scholarships.'
          : goal === 'jobs'
            ? 'Looking primarily for jobs.'
            : 'Looking for scholarships and jobs.'

      const { error: pErr } = await supabase.from('profiles').upsert({
        user_id: user.id,
        full_name: fullName.trim(),
        headline: headline.trim() || `${fullName.trim()} · ${country}`,
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
      window.setTimeout(() => navigate('/dashboard'), Math.max(2800, lines.length * 380))
    } catch (err) {
      setError(err.message || 'Could not save profile')
      setBusy(false)
    }
  }

  useEffect(() => {
    document.title = 'Setup — Opportunistic'
  }, [])

  return (
    <PageBackdrop image="auth.jpg" className="onboarding-page">
      <div ref={root}>
        <SiteHeader />
        <main className="container onboarding-layout">
          <section className="ob-panel glass-panel">
            <div className="ob-progress-head">
              <p className="eyebrow">
                Setup · {step + 1}/{GUIDE.length}
              </p>
              <div className="progress">
                <div style={{ width: `${progress}%` }} />
              </div>
            </div>

            <h1>{guide.title}</h1>

            {step === 0 && (
              <div className="stack-form">
                <label>
                  Country for job matching
                  <select value={country} onChange={(e) => setCountry(e.target.value)}>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="choice-pills" role="group" aria-label="What are you looking for?">
                  {[
                    ['both', 'Scholarships + jobs'],
                    ['scholarships', 'Mostly scholarships'],
                    ['jobs', 'Mostly jobs'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`choice-pill ${goal === value ? 'active' : ''}`}
                      onClick={() => setGoal(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="stack-form">
                <label>
                  Full name
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Thabo Molefe"
                    autoComplete="name"
                  />
                </label>
                <label>
                  Headline <span className="optional">(optional)</span>
                  <input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="BSc CS · React developer"
                  />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="stack-form">
                {qualifications.map((q, i) => (
                  <div className="card-lite" key={i}>
                    <div className="inline-fields">
                      <label>
                        Type
                        <select value={q.type} onChange={(e) => updateQual(i, 'type', e.target.value)}>
                          <option value="degree">Degree</option>
                          <option value="certificate">Certificate</option>
                        </select>
                      </label>
                      <label>
                        Year
                        <input type="number" value={q.year} onChange={(e) => updateQual(i, 'year', e.target.value)} />
                      </label>
                    </div>
                    <label>
                      Field of study
                      <input
                        value={q.field}
                        onChange={(e) => updateQual(i, 'field', e.target.value)}
                        placeholder="Computer Science"
                      />
                    </label>
                    <label>
                      Institution <span className="optional">(optional)</span>
                      <input
                        value={q.institution}
                        onChange={(e) => updateQual(i, 'institution', e.target.value)}
                        placeholder="University name"
                      />
                    </label>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost" onClick={() => setQualifications((r) => [...r, { ...emptyQual }])}>
                  + Add another qualification
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="stack-form">
                {skills.map((s, i) => (
                  <div className="card-lite" key={i}>
                    <label>
                      Skill name
                      <input
                        value={s.skill_name}
                        onChange={(e) => updateSkill(i, 'skill_name', e.target.value)}
                        placeholder="React"
                      />
                    </label>
                    <label>
                      How strong are you?
                      <select value={s.proficiency} onChange={(e) => updateSkill(i, 'proficiency', e.target.value)}>
                        <option value="beginner">Beginner — learning</option>
                        <option value="intermediate">Intermediate — can ship</option>
                        <option value="advanced">Advanced — deep experience</option>
                        <option value="expert">Expert — lead / teach</option>
                      </select>
                    </label>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost" onClick={() => setSkills((r) => [...r, { ...emptySkill }])}>
                  + Add another skill
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="ob-process">
                <div className="scan-core compact" aria-hidden="true">
                  <span className="scan-ring" />
                  <span className="scan-ring" />
                  <img src={`${import.meta.env.BASE_URL}mark.svg`} alt="" width="36" height="36" />
                </div>
                <p className="ob-process-title">{busy ? 'Matching in progress…' : 'Ready to process your profile'}</p>
                <div className="jarvis-log-lines ob-logs">
                  {processLogs.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  {busy ? <span className="log-cursor" aria-hidden="true" /> : null}
                </div>
              </div>
            )}

            {error ? <p className="form-message">{error}</p> : null}

            <div className="cta-row ob-actions">
              {step > 0 && step < 4 ? (
                <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)} disabled={busy}>
                  Back
                </button>
              ) : null}
              {step < 4 ? (
                <button
                  type="button"
                  className="btn btn-auth"
                  disabled={!canContinue()}
                  onClick={() => setStep((s) => s + 1)}
                >
                  <span>{step === 3 ? 'Review & process' : 'Continue'}</span>
                  <span className="btn-auth-shine" aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className="btn btn-auth" disabled={busy} onClick={finish}>
                  <span>{busy ? 'Processing…' : 'Start matching'}</span>
                  <span className="btn-auth-shine" aria-hidden="true" />
                </button>
              )}
            </div>
          </section>

          <aside className="ob-assistant jarvis-screen">
            <div className="jarvis-chrome">
              <div className="jarvis-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p className="jarvis-title">OPPORTUNISTIC // GUIDE</p>
              <p className="jarvis-status">STEP {step + 1}</p>
            </div>
            <div className="ob-assistant-body">
              <p className="jarvis-caption">What this step does</p>
              <p className="ob-tip">{guide.tip}</p>
              <p className="jarvis-caption">Why it matters</p>
              <p className="ob-tip muted">{guide.why}</p>

              <p className="jarvis-caption">Live feed</p>
              <div className="feed-chips">
                {feedPreview.length ? (
                  feedPreview.map((c) => (
                    <span key={c} className="feed-chip">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="feed-chip muted-chip">Waiting for your first inputs…</span>
                )}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </PageBackdrop>
  )
}
