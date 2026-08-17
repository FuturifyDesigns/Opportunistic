import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { COUNTRIES } from '../lib/countries'
import { supabase } from '../lib/supabase'
import { runMatchingForUser } from '../lib/matchingService'
import {
  defaultBioForGoal,
  normalizeGoal,
  resolveGoal,
  stripGoalTag,
  updateProfile,
} from '../lib/goal'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import PageBackdrop from '../components/PageBackdrop'
import SkillPicker from '../components/SkillPicker'
import AvatarEditor from '../components/AvatarEditor'
import { normalizeSkillName, normalizeFieldName, suggestSkillsFromQualifications } from '../lib/skillCatalog'
import HeadlineComposer from '../components/HeadlineComposer'
import { finalizeHeadline } from '../lib/headline'
import { validateProfileForm } from '../lib/fieldValidation'
import { prefersReducedMotion } from '../lib/animations'
import { removeAvatar, uploadAvatar } from '../lib/avatar'

gsap.registerPlugin(useGSAP)

const emptyQual = { type: 'degree', field: '', institution: '', year: new Date().getFullYear() }

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const root = useRef(null)
  const [form, setForm] = useState({
    full_name: '',
    headline: '',
    bio: '',
    country: 'Botswana',
    goal: 'both',
  })
  const [qualifications, setQualifications] = useState([{ ...emptyQual }])
  const [skills, setSkills] = useState([])
  const [busy, setBusy] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [baseline, setBaseline] = useState(null)
  const [errors, setErrors] = useState({})
  const hydratedRef = useRef(false)

  useEffect(() => {
    document.title = t('profile.metaTitle')
  }, [t, i18n.language])

  useEffect(() => {
    if (!user?.id || !profile || hydratedRef.current) return

    let cancelled = false

    async function load() {
      const [{ data: q }, { data: s }] = await Promise.all([
        supabase.from('qualifications').select('*').eq('user_id', user.id),
        supabase.from('skills').select('*').eq('user_id', user.id),
      ])
      if (cancelled) return

      setForm({
        full_name: profile.full_name || '',
        headline: profile.headline || '',
        bio: stripGoalTag(profile.bio || ''),
        country: profile.country || 'Botswana',
        goal: resolveGoal(profile),
      })

      if (q?.length) setQualifications(q)
      else setQualifications([{ ...emptyQual }])

      if (s?.length) {
        const catalog = new Set(
          suggestSkillsFromQualifications(q || []).map((name) => name.toLowerCase()),
        )
        setSkills(
          s.map((row) => ({
            skill_name: row.skill_name,
            proficiency: row.proficiency || 'intermediate',
            is_custom: !catalog.has((row.skill_name || '').trim().toLowerCase()),
          })),
        )
      } else {
        setSkills([])
      }

      setBaseline({
        country: profile.country || 'Botswana',
        goal: resolveGoal(profile),
        quals: JSON.stringify(
          (q || []).map((row) => ({
            type: row.type,
            field: normalizeFieldName(row.field || ''),
            institution: (row.institution || '').trim(),
            year: Number(row.year) || null,
          })),
        ),
        skills: JSON.stringify(
          (s || []).map((row) => ({
            skill_name: normalizeSkillName(row.skill_name || ''),
            proficiency: row.proficiency || 'intermediate',
          })),
        ),
      })
      hydratedRef.current = true
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [profile, user?.id])

  useEffect(
    () => () => {
      hydratedRef.current = false
    },
    [user?.id],
  )

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from('.profile-identity, .profile-section, .profile-save-bar', {
        y: 18,
        opacity: 0,
        duration: 0.45,
        stagger: 0.07,
        ease: 'power2.out',
        clearProps: 'all',
      })
    },
    { scope: root, dependencies: [i18n.language] },
  )

  const filledQuals = useMemo(
    () => qualifications.filter((q) => q.field?.trim()).length,
    [qualifications],
  )
  const filledSkills = useMemo(
    () => skills.filter((s) => s.skill_name?.trim()).length,
    [skills],
  )

  const goalLabel = useMemo(() => {
    if (form.goal === 'scholarships') return t('onboarding.goalScholarships')
    if (form.goal === 'jobs') return t('onboarding.goalJobs')
    return t('onboarding.goalBoth')
  }, [form.goal, t])

  const needsRematch = useMemo(() => {
    if (!baseline) return false
    const nextQuals = JSON.stringify(
      qualifications
        .filter((q) => q.field?.trim())
        .map((q) => ({
          type: q.type,
          field: normalizeFieldName(q.field),
          institution: (q.institution || '').trim(),
          year: Number(q.year) || null,
        })),
    )
    const nextSkills = JSON.stringify(
      skills
        .filter((s) => s.skill_name?.trim())
        .map((s) => ({
          skill_name: normalizeSkillName(s.skill_name),
          proficiency: s.proficiency || 'intermediate',
        })),
    )
    return (
      form.country !== baseline.country ||
      normalizeGoal(form.goal) !== baseline.goal ||
      nextQuals !== baseline.quals ||
      nextSkills !== baseline.skills
    )
  }, [baseline, form.country, form.goal, qualifications, skills])

  function updateQual(i, patch) {
    setErrors((prev) => {
      const next = { ...prev }
      delete next.qualifications
      delete next[`qualField_${i}`]
      delete next[`qualInstitution_${i}`]
      delete next[`qualYear_${i}`]
      return next
    })
    setQualifications((rows) => rows.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  }

  function errMsg(key) {
    return errors[key] ? t(`onboarding.${errors[key]}`) : ''
  }

  function removeQual(i) {
    setQualifications((rows) => (rows.length <= 1 ? rows : rows.filter((_, idx) => idx !== i)))
  }

  async function save(e) {
    e.preventDefault()
    const { ok, errors: nextErrors } = validateProfileForm({
      fullName: form.full_name,
      headline: form.headline,
      bio: form.bio,
      qualifications,
      skills,
    })
    if (!ok) {
      setErrors(nextErrors)
      toast.error(t('onboarding.errFixFields'))
      return
    }
    setErrors({})
    setBusy(true)
    try {
      const focus = normalizeGoal(form.goal)
      const bioText = stripGoalTag(form.bio).trim() || stripGoalTag(defaultBioForGoal(focus, t))
      const { error: pErr } = await updateProfile(supabase, user.id, {
        full_name: form.full_name.trim(),
        headline: finalizeHeadline(form.headline),
        bio: bioText,
        country: form.country,
        goal: focus,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      if (pErr) throw pErr

      try {
        localStorage.setItem(`opp_goal_${user.id}`, focus)
      } catch {
        /* ignore */
      }

      await supabase.from('qualifications').delete().eq('user_id', user.id)
      await supabase.from('skills').delete().eq('user_id', user.id)

      const qualRows = qualifications
        .filter((q) => q.field?.trim())
        .map((q) => ({
          user_id: user.id,
          type: q.type,
          field: normalizeFieldName(q.field),
          institution: q.institution?.trim() || null,
          year: Number(q.year) || null,
        }))
        .filter((q) => q.field)
      const skillRows = skills
        .filter((s) => s.skill_name?.trim())
        .map((s) => ({
          user_id: user.id,
          skill_name: normalizeSkillName(s.skill_name),
          proficiency: s.proficiency || 'intermediate',
        }))
        .filter((s) => s.skill_name)

      if (qualRows.length) await supabase.from('qualifications').insert(qualRows)
      if (skillRows.length) await supabase.from('skills').insert(skillRows)

      if (needsRematch) {
        await runMatchingForUser(user.id, { reason: 'profile' })
        await refreshProfile()
        toast.success(t('profile.saveSuccessRematch'))
      } else {
        await refreshProfile()
        toast.success(t('profile.saveSuccessOnly'))
      }
      setTimeout(() => navigate('/dashboard'), 700)
    } catch (err) {
      toast.error(err.message || t('profile.saveError'))
    } finally {
      setBusy(false)
    }
  }

  async function onSaveAvatar(blob) {
    setAvatarBusy(true)
    try {
      await uploadAvatar(user.id, blob)
      await refreshProfile?.()
      toast.success(t('profile.avatarSaved'))
    } catch (err) {
      toast.error(err.message || t('profile.avatarSaveError'))
      throw err
    } finally {
      setAvatarBusy(false)
    }
  }

  async function onRemoveAvatar() {
    if (avatarBusy) return
    setAvatarBusy(true)
    try {
      await removeAvatar(user.id)
      await refreshProfile?.()
      toast.success(t('profile.avatarRemoved'))
    } catch (err) {
      toast.error(err.message || t('profile.avatarSaveError'))
    } finally {
      setAvatarBusy(false)
    }
  }

  return (
    <PageBackdrop image="auth.jpg" className="profile-page">
      <SiteHeader />
      <main className="profile-shell" ref={root}>
        <header className="profile-identity" data-no-glitch data-live-preview>
          <div className="profile-identity-main">
            <div className="profile-avatar-wrap">
              <button
                type="button"
                className={`profile-avatar ${profile?.avatar_url ? 'has-photo' : ''}`}
                disabled={avatarBusy}
                onClick={() => setEditorOpen(true)}
                aria-label={profile?.avatar_url ? t('profile.avatarEdit') : t('profile.avatarUpload')}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" />
                ) : (
                  <span aria-hidden="true">{initialsFromName(form.full_name)}</span>
                )}
              </button>
              <div className="profile-avatar-actions">
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={avatarBusy}
                  onClick={() => setEditorOpen(true)}
                >
                  {profile?.avatar_url ? t('profile.avatarEdit') : t('profile.avatarUpload')}
                </button>
                {profile?.avatar_url ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={avatarBusy}
                    onClick={() => void onRemoveAvatar()}
                  >
                    {t('profile.avatarRemove')}
                  </button>
                ) : null}
              </div>
            </div>
            <div className="profile-identity-copy">
              <p className="eyebrow">{t('profile.eyebrow')}</p>
              <h1 data-no-glitch>
                {form.full_name.trim() || t('profile.title')}
              </h1>
              <p className="profile-identity-headline">
                {form.headline.trim() || t('profile.headlinePlaceholder')}
              </p>
              <div className="profile-meta-row">
                <span className="profile-chip">{form.country}</span>
                <span className="profile-chip">{goalLabel}</span>
                <span className="profile-chip">
                  {t('profile.statQuals', { count: filledQuals })}
                </span>
                <span className="profile-chip">
                  {t('profile.statSkills', { count: filledSkills })}
                </span>
              </div>
            </div>
          </div>
          <p className="profile-identity-lede">{t('profile.lede')}</p>
          <Link className="profile-back" to="/dashboard">
            {t('profile.backDashboard')}
          </Link>
        </header>

        <AvatarEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSave={onSaveAvatar}
        />

        <form className="profile-form" onSubmit={save}>
          <section className="profile-section" aria-labelledby="profile-about-heading">
            <div className="profile-section-head">
              <p className="profile-step">{t('profile.sectionAboutStep')}</p>
              <h2 id="profile-about-heading">{t('profile.sectionAbout')}</h2>
              <p>{t('profile.sectionAboutHint')}</p>
            </div>
            <div className="profile-fields">
              <label className={`profile-field${errors.fullName ? ' invalid' : ''}`}>
                <span>{t('profile.fullName')}</span>
                <input
                  value={form.full_name}
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, fullName: undefined }))
                    setForm({ ...form, full_name: e.target.value })
                  }}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.fullName)}
                />
                {errors.fullName ? (
                  <span className="field-error">{t(`onboarding.${errors.fullName}`)}</span>
                ) : null}
              </label>
              <label className={`profile-field${errors.headline ? ' invalid' : ''}`}>
                <span>{t('profile.headline')}</span>
                <HeadlineComposer
                  value={form.headline}
                  placeholder={t('profile.headlinePlaceholder')}
                  describedBy="profile-headline-hint"
                  ariaInvalid={Boolean(errors.headline)}
                  onChange={(next) => {
                    setErrors((prev) => ({ ...prev, headline: undefined }))
                    setForm((f) => ({ ...f, headline: next }))
                  }}
                  onBlur={() => {
                    setForm((f) => ({ ...f, headline: finalizeHeadline(f.headline) }))
                  }}
                />
                {errors.headline ? (
                  <span className="field-error">{t(`onboarding.${errors.headline}`)}</span>
                ) : null}
                <p id="profile-headline-hint" className="headline-hint">
                  {t('profile.headlineHint')}
                  <span className="headline-hint-example">{t('profile.headlineHintExample')}</span>
                </p>
              </label>
              <label className={`profile-field profile-field-full${errors.bio ? ' invalid' : ''}`}>
                <span>{t('profile.bio')}</span>
                <textarea
                  rows={4}
                  value={form.bio}
                  placeholder={t('profile.bioPlaceholder')}
                  aria-invalid={Boolean(errors.bio)}
                  onChange={(e) => {
                    setErrors((prev) => ({ ...prev, bio: undefined }))
                    setForm({ ...form, bio: e.target.value })
                  }}
                />
                {errors.bio ? <span className="field-error">{t(`onboarding.${errors.bio}`)}</span> : null}
              </label>
              <label className="profile-field">
                <span>{t('profile.country')}</span>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="profile-section" aria-labelledby="profile-focus-heading">
            <div className="profile-section-head">
              <p className="profile-step">{t('profile.sectionFocusStep')}</p>
              <h2 id="profile-focus-heading">{t('profile.sectionFocus')}</h2>
              <p>{t('profile.goalHint')}</p>
            </div>
            <div className="choice-pills profile-goal-pills" role="group" aria-label={t('onboarding.goalAria')}>
              {[
                ['both', t('onboarding.goalBoth')],
                ['scholarships', t('onboarding.goalScholarships')],
                ['jobs', t('onboarding.goalJobs')],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`choice-pill ${form.goal === value ? 'active' : ''}`}
                  aria-pressed={form.goal === value}
                  onClick={() => setForm({ ...form, goal: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="profile-section" aria-labelledby="profile-quals-heading">
            <div className="profile-section-head">
              <p className="profile-step">{t('profile.sectionQualsStep')}</p>
              <h2 id="profile-quals-heading">{t('profile.qualsTitle')}</h2>
              <p>{t('profile.qualsHint')}</p>
            </div>

            <div className="profile-qual-list">
              {qualifications.map((q, i) => (
                <div className="profile-qual" key={i}>
                  <div className="profile-qual-top">
                    <span className="profile-qual-index">
                      {t('profile.qualIndex', { n: i + 1 })}
                    </span>
                    {qualifications.length > 1 ? (
                      <button
                        type="button"
                        className="profile-qual-remove"
                        onClick={() => removeQual(i)}
                      >
                        {t('profile.removeQual')}
                      </button>
                    ) : null}
                  </div>
                  <div className="profile-qual-grid">
                    <label className="profile-field">
                      <span>{t('profile.qualType')}</span>
                      <select value={q.type} onChange={(e) => updateQual(i, { type: e.target.value })}>
                        <option value="degree">{t('profile.qualDegree')}</option>
                        <option value="certificate">{t('profile.qualCertificate')}</option>
                      </select>
                    </label>
                    <label className={`profile-field${errMsg(`qualYear_${i}`) ? ' invalid' : ''}`}>
                      <span>{t('profile.qualYear')}</span>
                      <input
                        type="number"
                        min="1950"
                        max="2100"
                        value={q.year || ''}
                        onChange={(e) => updateQual(i, { year: e.target.value })}
                      />
                      {errMsg(`qualYear_${i}`) ? (
                        <span className="field-error">{errMsg(`qualYear_${i}`)}</span>
                      ) : null}
                    </label>
                    <label
                      className={`profile-field profile-field-full${
                        errMsg(`qualField_${i}`) || (i === 0 && errMsg('qualifications')) ? ' invalid' : ''
                      }`}
                    >
                      <span>{t('profile.qualField')}</span>
                      <input
                        value={q.field || ''}
                        placeholder={t('profile.qualFieldPlaceholder')}
                        onChange={(e) => updateQual(i, { field: e.target.value })}
                        onBlur={() => {
                          const fixed = normalizeFieldName(q.field)
                          if (fixed && fixed !== q.field) updateQual(i, { field: fixed })
                        }}
                      />
                      {errMsg(`qualField_${i}`) ? (
                        <span className="field-error">{errMsg(`qualField_${i}`)}</span>
                      ) : null}
                      {i === 0 && errMsg('qualifications') && !errMsg(`qualField_${i}`) ? (
                        <span className="field-error">{errMsg('qualifications')}</span>
                      ) : null}
                    </label>
                    <label className={`profile-field profile-field-full${errMsg(`qualInstitution_${i}`) ? ' invalid' : ''}`}>
                      <span>{t('profile.qualInstitution')}</span>
                      <input
                        value={q.institution || ''}
                        placeholder={t('profile.qualInstitutionPlaceholder')}
                        onChange={(e) => updateQual(i, { institution: e.target.value })}
                      />
                      {errMsg(`qualInstitution_${i}`) ? (
                        <span className="field-error">{errMsg(`qualInstitution_${i}`)}</span>
                      ) : null}
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-ghost profile-add-qual"
              onClick={() => setQualifications((r) => [...r, { ...emptyQual }])}
            >
              {t('profile.addQual')}
            </button>
          </section>

          <section className="profile-section" aria-labelledby="profile-skills-heading">
            <div className="profile-section-head">
              <p className="profile-step">{t('profile.sectionSkillsStep')}</p>
              <h2 id="profile-skills-heading">{t('profile.skillsTitle')}</h2>
              <p>{t('profile.skillsHint')}</p>
            </div>
            <SkillPicker
              qualifications={qualifications}
              value={skills}
              onChange={(next) => {
                setErrors((prev) => ({ ...prev, skills: undefined }))
                setSkills(next)
              }}
            />
            {errors.skills ? (
              <p className="field-error">{t(`onboarding.${errors.skills}`)}</p>
            ) : null}
          </section>

          <div className="profile-save-bar">
            <div className="profile-save-copy">
              <strong>{needsRematch ? t('profile.saveBarTitleRematch') : t('profile.saveBarTitle')}</strong>
              <span>{needsRematch ? t('profile.saveBarBodyRematch') : t('profile.saveBarBody')}</span>
            </div>
            <div className="profile-save-actions">
              <Link className="btn btn-ghost" to="/dashboard">
                {t('common.cancel')}
              </Link>
              <button className="btn btn-match" type="submit" disabled={busy}>
                {busy
                  ? needsRematch
                    ? t('profile.savingRematch')
                    : t('profile.saving')
                  : needsRematch
                    ? t('profile.saveRematch')
                    : t('profile.save')}
              </button>
            </div>
          </div>
        </form>
      </main>
      <SiteFooter />
    </PageBackdrop>
  )
}
