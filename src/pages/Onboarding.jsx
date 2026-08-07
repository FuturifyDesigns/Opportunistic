import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { COUNTRIES } from '../lib/countries'
import { supabase } from '../lib/supabase'
import { runMatchingForUser } from '../lib/matchingService'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import SiteHeader from '../components/SiteHeader'
import PageBackdrop from '../components/PageBackdrop'
import SkillPicker from '../components/SkillPicker'
import MatchBeacon from '../components/MatchBeacon'
import { prefersReducedMotion } from '../lib/animations'
import { normalizeSkillName } from '../lib/skillCatalog'
import { validateOnboardingStep } from '../lib/fieldValidation'

gsap.registerPlugin(useGSAP)

const emptyQual = { type: 'degree', field: '', institution: '', year: new Date().getFullYear() }

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const toast = useToast()
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
  const [fieldErrors, setFieldErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [processLogs, setProcessLogs] = useState([])
  const [beaconOpen, setBeaconOpen] = useState(false)
  const [beaconDone, setBeaconDone] = useState(false)

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
  const formData = useMemo(
    () => ({ country, fullName, headline, qualifications, skills }),
    [country, fullName, headline, qualifications, skills],
  )

  const feedPreview = useMemo(() => {
    const items = [t('onboarding.feedCountry', { country })]
    if (fullName) items.push(t('onboarding.feedName', { name: fullName.split(' ')[0] }))
    if (headline) {
      items.push(
        t('onboarding.feedHeadline', {
          headline: `${headline.slice(0, 28)}${headline.length > 28 ? '…' : ''}`,
        }),
      )
    }
    qualifications.filter((q) => q.field.trim()).forEach((q) => items.push(`${q.type} · ${q.field}`))
    skills
      .filter((s) => s.skill_name.trim())
      .forEach((s) => items.push(t('onboarding.feedSkill', { skill: s.skill_name })))
    return items.slice(0, 6)
  }, [country, fullName, headline, qualifications, skills, t, i18n.language])

  const summary = useMemo(() => {
    const qualCount = qualifications.filter((q) => q.field.trim()).length
    const skillCount = skills.filter((s) => s.skill_name.trim()).length
    const goalLabel =
      goal === 'scholarships'
        ? t('onboarding.goalScholarships')
        : goal === 'jobs'
          ? t('onboarding.goalJobs')
          : t('onboarding.goalBoth')
    return [
      { label: t('onboarding.summaryCountry'), value: country },
      { label: t('onboarding.summaryName'), value: fullName.trim() || '—' },
      { label: t('onboarding.summaryGoal'), value: goalLabel },
      { label: t('onboarding.summaryQuals'), value: String(qualCount) },
      { label: t('onboarding.summarySkills'), value: String(skillCount) },
    ]
  }, [country, fullName, goal, qualifications, skills, t])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.fromTo(
        '.ob-panel, .ob-assistant',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' },
      )
    },
    { scope: root, dependencies: [step], revertOnUpdate: true },
  )

  function updateQual(i, key, value) {
    setQualifications((rows) => rows.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[`qualField_${i}`]
      delete next[`qualInstitution_${i}`]
      delete next[`qualYear_${i}`]
      delete next.qualifications
      return next
    })
  }

  function markTouched(key) {
    setTouched((prev) => ({ ...prev, [key]: true }))
  }

  function validateCurrent(showAll = false) {
    const { ok, errors } = validateOnboardingStep(step, formData)
    setFieldErrors(errors)
    if (showAll) {
      const keys = Object.keys(errors)
      if (keys.length) {
        setTouched((prev) => {
          const next = { ...prev }
          keys.forEach((k) => {
            next[k] = true
          })
          return next
        })
      }
    }
    return ok
  }

  function errMsg(key) {
    const code = fieldErrors[key]
    if (!code) return null
    if (!(touched[key] || touched._attempt)) return null
    return t(`onboarding.${code}`)
  }

  function goNext() {
    setTouched((prev) => ({ ...prev, _attempt: true }))
    if (!validateCurrent(true)) {
      setError(t('onboarding.errFixFields'))
      return
    }
    setError('')
    setTouched({})
    setFieldErrors({})
    setStep((s) => s + 1)
  }

  async function finish() {
    setBusy(true)
    setError('')
    setBeaconDone(false)
    setBeaconOpen(true)
    setProcessLogs([])

    const lines = [
      t('onboarding.logLock'),
      t('onboarding.logCountry', { country }),
      t('onboarding.logQuals', { count: qualifications.filter((q) => q.field.trim()).length }),
      t('onboarding.logSkills', { count: skills.filter((s) => s.skill_name.trim()).length }),
      t('onboarding.logQueries'),
      t('onboarding.logScoring'),
      t('onboarding.logPush'),
    ]

    let lineTimer = null
    let i = 0
    lineTimer = window.setInterval(() => {
      if (i >= lines.length) {
        window.clearInterval(lineTimer)
        return
      }
      setProcessLogs((prev) => [...prev, lines[i]])
      i += 1
    }, 420)

    try {
      const bio =
        goal === 'scholarships'
          ? t('onboarding.bioScholarships')
          : goal === 'jobs'
            ? t('onboarding.bioJobs')
            : t('onboarding.bioBoth')

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

      window.clearInterval(lineTimer)
      setProcessLogs(lines)
      setBeaconDone(true)
      toast.success(t('onboarding.doneToast'))
      window.setTimeout(() => navigate('/dashboard'), prefersReducedMotion() ? 700 : 2200)
    } catch (err) {
      window.clearInterval(lineTimer)
      const msg = err.message || t('onboarding.saveError')
      setError(msg)
      toast.error(msg)
      setBusy(false)
      setBeaconOpen(false)
      setBeaconDone(false)
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
              <div className="ob-progress-meta">
                <p className="eyebrow">
                  {t('onboarding.setupEyebrow', { step: step + 1, total: GUIDE.length })}
                </p>
                <span className="ob-step-label">{guide.id}</span>
              </div>
              <div className="progress ob-progress">
                <div style={{ width: `${progress}%` }} />
              </div>
            </div>

            <h1 key={guide.id}>{guide.title}</h1>

            {step === 0 && (
              <div className="stack-form">
                <label className={errMsg('country') ? 'invalid' : ''}>
                  {t('onboarding.countryLabel')}
                  <select
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value)
                      setFieldErrors((p) => ({ ...p, country: undefined }))
                    }}
                    onBlur={() => markTouched('country')}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errMsg('country') ? <span className="field-error">{errMsg('country')}</span> : null}
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
                <label className={errMsg('fullName') ? 'invalid' : ''}>
                  {t('onboarding.fullName')}
                  <input
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      setFieldErrors((p) => ({ ...p, fullName: undefined }))
                    }}
                    onBlur={() => {
                      markTouched('fullName')
                      validateCurrent()
                    }}
                    placeholder={t('onboarding.fullNamePlaceholder')}
                    autoComplete="name"
                    aria-invalid={Boolean(errMsg('fullName'))}
                  />
                  {errMsg('fullName') ? <span className="field-error">{errMsg('fullName')}</span> : null}
                </label>
                <label className={errMsg('headline') ? 'invalid' : ''}>
                  {t('onboarding.headline')} <span className="optional">{t('onboarding.optional')}</span>
                  <input
                    value={headline}
                    onChange={(e) => {
                      setHeadline(e.target.value)
                      setFieldErrors((p) => ({ ...p, headline: undefined }))
                    }}
                    onBlur={() => {
                      markTouched('headline')
                      validateCurrent()
                    }}
                    placeholder={t('onboarding.headlinePlaceholder')}
                    aria-invalid={Boolean(errMsg('headline'))}
                  />
                  {errMsg('headline') ? <span className="field-error">{errMsg('headline')}</span> : null}
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="stack-form">
                {qualifications.map((q, i) => (
                  <div className="ob-qual-card" key={i}>
                    <div className="inline-fields">
                      <label>
                        {t('onboarding.qualType')}
                        <select value={q.type} onChange={(e) => updateQual(i, 'type', e.target.value)}>
                          <option value="degree">{t('onboarding.qualDegree')}</option>
                          <option value="certificate">{t('onboarding.qualCertificate')}</option>
                        </select>
                      </label>
                      <label className={errMsg(`qualYear_${i}`) ? 'invalid' : ''}>
                        {t('onboarding.qualYear')}
                        <input
                          type="number"
                          value={q.year}
                          onChange={(e) => updateQual(i, 'year', e.target.value)}
                          onBlur={() => markTouched(`qualYear_${i}`)}
                        />
                        {errMsg(`qualYear_${i}`) ? (
                          <span className="field-error">{errMsg(`qualYear_${i}`)}</span>
                        ) : null}
                      </label>
                    </div>
                    <label className={errMsg(`qualField_${i}`) || errMsg('qualifications') ? 'invalid' : ''}>
                      {t('onboarding.qualField')}
                      <input
                        value={q.field}
                        onChange={(e) => updateQual(i, 'field', e.target.value)}
                        onBlur={() => markTouched(`qualField_${i}`)}
                        placeholder={t('onboarding.qualFieldPlaceholder')}
                      />
                      {errMsg(`qualField_${i}`) ? (
                        <span className="field-error">{errMsg(`qualField_${i}`)}</span>
                      ) : null}
                      {!errMsg(`qualField_${i}`) && errMsg('qualifications') && i === 0 ? (
                        <span className="field-error">{errMsg('qualifications')}</span>
                      ) : null}
                    </label>
                    <label className={errMsg(`qualInstitution_${i}`) ? 'invalid' : ''}>
                      {t('onboarding.qualInstitution')} <span className="optional">{t('onboarding.optional')}</span>
                      <input
                        value={q.institution}
                        onChange={(e) => updateQual(i, 'institution', e.target.value)}
                        onBlur={() => markTouched(`qualInstitution_${i}`)}
                        placeholder={t('onboarding.qualInstitutionPlaceholder')}
                      />
                      {errMsg(`qualInstitution_${i}`) ? (
                        <span className="field-error">{errMsg(`qualInstitution_${i}`)}</span>
                      ) : null}
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setQualifications((r) => [...r, { ...emptyQual }])}
                >
                  {t('onboarding.addQual')}
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="stack-form">
                <SkillPicker qualifications={qualifications} value={skills} onChange={setSkills} />
                {errMsg('skills') ? <span className="field-error">{errMsg('skills')}</span> : null}
              </div>
            )}

            {step === 4 && (
              <div className="ob-review">
                <p className="ob-review-lede">{t('onboarding.reviewLede')}</p>
                <ul className="ob-summary">
                  {summary.map((row) => (
                    <li key={row.label}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && !beaconOpen ? <p className="form-message">{error}</p> : null}

            <div className="cta-row ob-actions">
              {step > 0 && step < 4 ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setError('')
                    setFieldErrors({})
                    setTouched({})
                    setStep((s) => s - 1)
                  }}
                  disabled={busy}
                >
                  {t('onboarding.back')}
                </button>
              ) : null}
              {step < 4 ? (
                <button type="button" className="btn" onClick={goNext}>
                  {step === 3 ? t('onboarding.review') : t('onboarding.continue')}
                </button>
              ) : (
                <button type="button" className="btn btn-match" disabled={busy} onClick={finish}>
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

      <MatchBeacon active={beaconOpen} lines={processLogs} done={beaconDone} error="" />
    </PageBackdrop>
  )
}
