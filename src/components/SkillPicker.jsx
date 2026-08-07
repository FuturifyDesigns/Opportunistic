import { useEffect, useMemo, useState } from 'react'
import { normalizeSkillName, suggestSkillsFromQualifications } from '../lib/skillCatalog'

/**
 * Checkbox skills from degree fields + freeform custom skills.
 * value: Array<{ skill_name, proficiency, is_custom? }>
 */
export default function SkillPicker({ qualifications, value = [], onChange }) {
  const suggested = useMemo(() => suggestSkillsFromQualifications(qualifications), [qualifications])
  const selectedNames = useMemo(
    () => new Set(value.map((s) => s.skill_name.trim().toLowerCase()).filter(Boolean)),
    [value],
  )

  const customSkills = value.filter((s) => s.is_custom || (
    s.skill_name.trim() && !suggested.some((g) => g.toLowerCase() === s.skill_name.trim().toLowerCase())
  ))

  const [draft, setDraft] = useState('')
  const [defaultProficiency, setDefaultProficiency] = useState('intermediate')

  useEffect(() => {
    const allowed = new Set(suggested.map((s) => s.toLowerCase()))
    const next = value.filter((s) => {
      const name = s.skill_name.trim().toLowerCase()
      if (!name) return false
      if (s.is_custom) return true
      // Keep only suggested picks that still match the current degree fields
      return allowed.has(name)
    })
    const changed =
      next.length !== value.length ||
      next.some((s, i) => s.skill_name !== value[i]?.skill_name)
    if (changed) onChange(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggested.join('|')])

  function toggleSuggested(name) {
    const key = name.toLowerCase()
    const exists = value.find((s) => s.skill_name.trim().toLowerCase() === key)
    if (exists) {
      onChange(value.filter((s) => s.skill_name.trim().toLowerCase() !== key))
    } else {
      onChange([...value, { skill_name: name, proficiency: defaultProficiency, is_custom: false }])
    }
  }

  function addCustom() {
    const name = normalizeSkillName(draft)
    if (!name) return
    if (selectedNames.has(name.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...value, { skill_name: name, proficiency: defaultProficiency, is_custom: true }])
    setDraft('')
  }

  function removeSkill(name) {
    const key = name.toLowerCase()
    onChange(value.filter((s) => s.skill_name.trim().toLowerCase() !== key))
  }

  function setProficiency(name, proficiency) {
    const key = name.toLowerCase()
    onChange(
      value.map((s) => (s.skill_name.trim().toLowerCase() === key ? { ...s, proficiency } : s)),
    )
  }

  const fields = qualifications.map((q) => q.field).filter((f) => f?.trim())

  return (
    <div className="skill-picker">
      <div className="skill-picker-head">
        <p className="muted">
          {fields.length
            ? `Suggested from: ${fields.join(', ')}`
            : 'Add a qualification field first to unlock suggested skills.'}
        </p>
        <label className="skill-prof-default">
          Default level
          <select value={defaultProficiency} onChange={(e) => setDefaultProficiency(e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </label>
      </div>

      {suggested.length ? (
        <div className="skill-check-grid" role="group" aria-label="Suggested skills">
          {suggested.map((name) => {
            const checked = selectedNames.has(name.toLowerCase())
            return (
              <label key={name} className={`skill-check ${checked ? 'on' : ''}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleSuggested(name)} />
                <span>{name}</span>
              </label>
            )
          })}
        </div>
      ) : (
        <p className="muted">No catalog match yet — use Other skills below, or refine your degree field.</p>
      )}

      {value.length > 0 ? (
        <div className="skill-selected">
          <p className="jarvis-caption" style={{ color: 'var(--accent)' }}>
            Selected
          </p>
          <div className="skill-selected-list">
            {value.map((s) => (
              <div className="skill-selected-row" key={s.skill_name}>
                <strong>{s.skill_name}</strong>
                <select value={s.proficiency || 'intermediate'} onChange={(e) => setProficiency(s.skill_name, e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
                <button type="button" className="ghost-toggle" onClick={() => removeSkill(s.skill_name)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="skill-other">
        <p className="jarvis-caption" style={{ color: 'var(--accent)' }}>
          Other skills
        </p>
        <p className="muted">Not listed above? Add your own — press Add after each skill.</p>
        <div className="skill-other-row">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustom()
              }
            }}
            placeholder="e.g. GraphQL, Kiswahili, Grant writing"
          />
          <button type="button" className="btn btn-ghost" onClick={addCustom}>
            Add
          </button>
        </div>
        {customSkills.length ? (
          <div className="feed-chips" style={{ marginTop: '0.75rem' }}>
            {customSkills.map((s) => (
              <span key={s.skill_name} className="feed-chip">
                {s.skill_name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
