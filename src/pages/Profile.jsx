import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import SkillPicker from '../components/SkillPicker'
import { normalizeSkillName, normalizeFieldName, suggestSkillsFromQualifications } from '../lib/skillCatalog'

const emptyQual = { type: 'degree', field: '', institution: '', year: new Date().getFullYear() }

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
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

  useEffect(() => {
    document.title = t('profile.metaTitle')
  }, [t, i18n.language])

  useEffect(() => {
    async function load() {
      if (profile) {
        setForm({
          full_name: profile.full_name || '',
          headline: profile.headline || '',
          bio: stripGoalTag(profile.bio || ''),
          country: profile.country || 'Botswana',
          goal: resolveGoal(profile),
        })
      }
      const [{ data: q }, { data: s }] = await Promise.all([
        supabase.from('qualifications').select('*').eq('user_id', user.id),
        supabase.from('skills').select('*').eq('user_id', user.id),
      ])
      if (q?.length) setQualifications(q)
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
    }
    load()
  }, [profile, user.id])

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const focus = normalizeGoal(form.goal)
      const bioText = stripGoalTag(form.bio).trim() || stripGoalTag(defaultBioForGoal(focus, t))
      const { error: pErr } = await updateProfile(supabase, user.id, {
        full_name: form.full_name,
        headline: form.headline,
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

      await runMatchingForUser(user.id)
      await refreshProfile()
      toast.success(t('profile.saveSuccess'))
      setTimeout(() => navigate('/dashboard'), 700)
    } catch (err) {
      toast.error(err.message || t('profile.saveError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <SiteHeader />
      <main className="container narrow">
        <p className="eyebrow">{t('profile.eyebrow')}</p>
        <h1>{t('profile.title')}</h1>
        <p className="muted">{t('profile.lede')}</p>

        <form className="stack-form" onSubmit={save}>
          <label>
            {t('profile.fullName')}
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </label>
          <label>
            {t('profile.headline')}
            <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
          </label>
          <label>
            {t('profile.bio')}
            <textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </label>
          <label>
            {t('profile.country')}
            <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
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
                className={`choice-pill ${form.goal === value ? 'active' : ''}`}
                aria-pressed={form.goal === value}
                onClick={() => setForm({ ...form, goal: value })}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="muted" style={{ marginTop: '-0.35rem' }}>
            {t('profile.goalHint')}
          </p>

          <h2 className="form-section">{t('profile.qualsTitle')}</h2>
          {qualifications.map((q, i) => (
            <div className="card-lite" key={i}>
              <label>
                {t('profile.qualType')}
                <select
                  value={q.type}
                  onChange={(e) =>
                    setQualifications((rows) => rows.map((row, idx) => (idx === i ? { ...row, type: e.target.value } : row)))
                  }
                >
                  <option value="degree">{t('profile.qualDegree')}</option>
                  <option value="certificate">{t('profile.qualCertificate')}</option>
                </select>
              </label>
              <label>
                {t('profile.qualField')}
                <input
                  value={q.field || ''}
                  onChange={(e) =>
                    setQualifications((rows) => rows.map((row, idx) => (idx === i ? { ...row, field: e.target.value } : row)))
                  }
                  onBlur={() => {
                    const fixed = normalizeFieldName(q.field)
                    if (fixed && fixed !== q.field) {
                      setQualifications((rows) =>
                        rows.map((row, idx) => (idx === i ? { ...row, field: fixed } : row)),
                      )
                    }
                  }}
                />
              </label>
              <label>
                {t('profile.qualInstitution')}
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
                {t('profile.qualYear')}
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
            {t('profile.addQual')}
          </button>

          <h2 className="form-section">{t('profile.skillsTitle')}</h2>
          <p className="muted">{t('profile.skillsHint')}</p>
          <SkillPicker qualifications={qualifications} value={skills} onChange={setSkills} />

          <button className="btn" type="submit" disabled={busy}>
            {busy ? t('profile.saving') : t('profile.save')}
          </button>
        </form>
      </main>
      <SiteFooter />
    </div>
  )
}
