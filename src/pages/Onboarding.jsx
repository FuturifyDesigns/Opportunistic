import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { COUNTRIES } from '../lib/countries'
import { supabase } from '../lib/supabase'
import { runMatchingForUser } from '../lib/matchingService'
import { useAuth } from '../context/AuthContext'
import SiteHeader from '../components/SiteHeader'
import PageBackdrop from '../components/PageBackdrop'
import SkillPicker from '../components/SkillPicker'
import { prefersReducedMotion } from '../lib/animations'
import { normalizeSkillName } from '../lib/skillCatalog'

gsap.registerPlugin(useGSAP)

const emptyQual = { type: 'degree', field: '', institution: '', year: new Date().getFullYear() }

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const root = useRef(null)
  const [step, setStep] = useState(0)
  const [country, setCountry] = useState('Botswana')
  const [fullName, setFullName] = useState('')
  const [headline, setHeadline] = useState('')
  const [goal, setGoal] = useState('both')
  const [qualifications, setQualifications] = useState([{ ...emptyQual }])
  const [skills, setSkills] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [processLogs, setProcessLogs] = useState([])

  const GUIDE = useMemo(
    () => [
      {
        id: 'country',
        title: t('onboarding.guideCountryTitle'),
        tip: t('onboarding.guideCountryTip'),
        why: t('onboarding.guideCountryWhy'),
      },
      {
        id: 'you',
        title: t('onboarding.guideYouTitle'),
        tip: t('onboarding.guideYouTip'),
        why: t('onboarding.guideYouWhy'),
      },
      {
        id: 'quals',
        title: t('onboarding.guideQualsTitle'),
        tip: t('onboarding.guideQualsTip'),
        why: t('onboarding.guideQualsWhy'),
      },
      {
        id: 'skills',
        title: t('onboarding.guideSkillsTitle'),
        tip: t('onboarding.guideSkillsTip'),
        why: t('onboarding.guideSkillsWhy'),
      },
      {
        id: 'process',
        title: t('onboarding.guideProcessTitle'),
        tip: t('onboarding.guideProcessTip'),
        why: t('onboarding.guideProcessWhy'),
      },
    ],
    [t, i18n.language],
  )

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
          skill_name: normalizeSkillName(s.skill_name),
          proficiency: s.proficiency || 'intermediate',
        }))
        .filter((s) => s.skill_name)

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
      setError(err.message || t('onboarding.saveError'))
      setBusy(false)
    }
  }

  useEffect(() => {
    document.title = t('onboarding.metaTitle')
  }, [t, i18n.language])

  return (
    <PageBackdrop image="auth.jpg" className="onboarding-page">
      <div ref={root}>
        <SiteHeader />
        <main className="container onboarding-layout">
          <section className="ob-panel glass-panel">
            <div className="ob-progress-head">
              <p className="eyebrow">
                {t('onboarding.setupEyebrow', { step: step + 1, total: GUIDE.length })}
              </p>
              <div className="progress">
                <div style={{ width: `${progress}%` }} />
              </div>
            </div>

            <h1>{guide.title}</h1>

            {step === 0 && (
              <div className="stack-form">
                <label>
                  {t('onboarding.countryLabel')}
                  <select value={country} onChange={(e) => setCountry(e.target.value)}>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
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
                  {t('onboarding.fullName')}
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('onboarding.fullNamePlaceholder')}
                    autoComplete="name"
                  />
                </label>
                <label>
                  {t('onboarding.headline')} <span className="optional">{t('onboarding.optional')}</span>
                  <input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder={t('onboarding.headlinePlaceholder')}
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
                        {t('onboarding.qualType')}
                        <select value={q.type} onChange={(e) => updateQual(i, 'type', e.target.value)}>
                          <option value="degree">{t('onboarding.qualDegree')}</option>
                          <option value="certificate">{t('onboarding.qualCertificate')}</option>
                        </select>
                      </label>
                      <label>
                        {t('onboarding.qualYear')}
                        <input type="number" value={q.year} onChange={(e) => updateQual(i, 'year', e.target.value)} />
                      </label>
                    </div>
                    <label>
                      {t('onboarding.qualField')}
                      <input
                        value={q.field}
                        onChange={(e) => updateQual(i, 'field', e.target.value)}
                        placeholder={t('onboarding.qualFieldPlaceholder')}
                      />
                    </label>
                    <label>
                      {t('onboarding.qualInstitution')} <span className="optional">{t('onboarding.optional')}</span>
                      <input
                        value={q.institution}
                        onChange={(e) => updateQual(i, 'institution', e.target.value)}
                        placeholder={t('onboarding.qualInstitutionPlaceholder')}
                      />
                    </label>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost" onClick={() => setQualifications((r) => [...r, { ...emptyQual }])}>
                  {t('onboarding.addQual')}
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="stack-form">
                <SkillPicker qualifications={qualifications} value={skills} onChange={setSkills} />
              </div>
            )}

            {step === 4 && (
              <div className="ob-process">
                <div className="scan-core compact" aria-hidden="true">
                  <span className="scan-ring" />
                  <span className="scan-ring" />
                  <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width="40" height="40" />
                </div>
                <p className="ob-process-title">{busy ? t('onboarding.processBusy') : t('onboarding.processReady')}</p>
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
                  {t('onboarding.back')}
                </button>
              ) : null}
              {step < 4 ? (
                <button
                  type="button"
                  className="btn"
                  disabled={!canContinue()}
                  onClick={() => setStep((s) => s + 1)}
                >
                  {step === 3 ? t('onboarding.review') : t('onboarding.continue')}
                </button>
              ) : (
                <button type="button" className="btn" disabled={busy} onClick={finish}>
                  {busy ? t('onboarding.processing') : t('onboarding.startMatching')}
                </button>
              )}
            </div>
          </section>

          <aside className="ob-assistant jarvis-screen">
            <div className="jarvis-chrome">
              <p className="jarvis-title">{t('onboarding.assistantTitle')}</p>
              <p className="jarvis-status">{t('onboarding.assistantStep', { step: step + 1 })}</p>
            </div>
            <div className="ob-assistant-body">
              <p className="jarvis-caption">{t('onboarding.assistantWhat')}</p>
              <p className="ob-tip">{guide.tip}</p>
              <p className="jarvis-caption">{t('onboarding.assistantWhy')}</p>
              <p className="ob-tip muted">{guide.why}</p>

              <p className="jarvis-caption">{t('onboarding.assistantFeed')}</p>
              <div className="feed-chips">
                {feedPreview.length ? (
                  feedPreview.map((c) => (
                    <span key={c} className="feed-chip">
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="feed-chip muted-chip">{t('onboarding.feedWaiting')}</span>
                )}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </PageBackdrop>
  )
}
