/**
 * Shared text-field validation for onboarding (and reusable elsewhere).
 * Rejects empty junk, single symbols, punctuation-only, digits-only names, etc.
 */

const LETTER = /[\p{L}]/u
const NAME_OK = /^[\p{L}][\p{L}\p{M}'’\-.\s]*$/u
const MEANINGFUL = /[\p{L}\p{N}]/u

export function hasMeaningfulText(value) {
  const v = String(value ?? '').trim()
  if (v.length < 2) return false
  if (!MEANINGFUL.test(v)) return false
  // Reject strings that are only repeated punctuation / symbols
  const lettersOrDigits = (v.match(/[\p{L}\p{N}]/gu) || []).length
  if (lettersOrDigits < 2) return false
  return true
}

export function isValidPersonName(value) {
  const v = String(value ?? '').trim()
  if (v.length < 2) return false
  if (!LETTER.test(v)) return false
  if (!NAME_OK.test(v)) return false
  if ((v.match(/[\p{L}]/gu) || []).length < 2) return false
  return true
}

export function isValidOptionalText(value) {
  const v = String(value ?? '').trim()
  if (!v) return true
  return hasMeaningfulText(v)
}

export function isValidYear(value, { min = 1950, max = new Date().getFullYear() + 6 } = {}) {
  const n = Number(value)
  if (!Number.isFinite(n) || !Number.isInteger(n)) return false
  return n >= min && n <= max
}

/**
 * Validate onboarding step fields. Returns { ok, errors } where errors is
 * a map of field keys to i18n message keys (without the onboarding. prefix).
 */
export function validateOnboardingStep(step, data) {
  const errors = {}

  if (step === 0) {
    if (!String(data.country || '').trim()) errors.country = 'errCountryRequired'
  }

  if (step === 1) {
    if (!isValidPersonName(data.fullName)) errors.fullName = 'errNameInvalid'
    if (!isValidOptionalText(data.headline)) errors.headline = 'errTextJunk'
  }

  if (step === 2) {
    const quals = data.qualifications || []
    const filled = quals.filter((q) => String(q.field || '').trim())
    if (!filled.length) {
      errors.qualifications = 'errQualRequired'
    } else {
      quals.forEach((q, i) => {
        const field = String(q.field || '').trim()
        const institution = String(q.institution || '').trim()
        if (!field && !institution) return
        if (field && !hasMeaningfulText(field)) errors[`qualField_${i}`] = 'errTextJunk'
        if (institution && !hasMeaningfulText(institution)) errors[`qualInstitution_${i}`] = 'errTextJunk'
        if (field || institution) {
          if (!isValidYear(q.year)) errors[`qualYear_${i}`] = 'errYearInvalid'
        }
      })
    }
  }

  if (step === 3) {
    const skills = (data.skills || []).filter((s) => String(s.skill_name || '').trim())
    if (!skills.length) {
      errors.skills = 'errSkillsRequired'
    } else {
      skills.forEach((s, i) => {
        if (!hasMeaningfulText(s.skill_name)) errors[`skill_${i}`] = 'errTextJunk'
      })
    }
  }

  return { ok: Object.keys(errors).length === 0, errors }
}
