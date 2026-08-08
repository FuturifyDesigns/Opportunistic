import { useTranslation } from 'react-i18next'

/**
 * Visual skill match scorecards for a listing.
 */
export default function SkillScorecard({ scorecard, compact = false }) {
  const { t } = useTranslation()
  if (!scorecard) return null
  const hasSkills = Boolean(scorecard.skills?.length)
  const hasField = Boolean(scorecard.field?.label)
  const hasLoc = Boolean(scorecard.location?.label)
  if (!hasSkills && !hasField && !hasLoc) return null

  const skills = (scorecard.skills || []).slice(0, compact ? 4 : 8)

  return (
    <div className={`skill-scorecard ${compact ? 'compact' : ''}`.trim()}>
      {!compact ? (
        <div className="skill-scorecard-head">
          <h3>{t('match.skillScoreTitle')}</h3>
          <p className="muted">{t('match.skillScoreLede')}</p>
        </div>
      ) : (
        <p className="skill-scorecard-label">{t('match.skillScoreTitle')}</p>
      )}

      {scorecard.field?.label ? (
        <div className="skill-bar-row">
          <div className="skill-bar-meta">
            <span>{t('match.fieldFit', { field: scorecard.field.label })}</span>
            <strong>{Math.round(scorecard.field.score || 0)}%</strong>
          </div>
          <div className="skill-bar-track" aria-hidden="true">
            <span style={{ width: `${Math.max(4, Math.min(100, scorecard.field.score || 0))}%` }} />
          </div>
        </div>
      ) : null}

      {scorecard.location?.label ? (
        <div className="skill-bar-row">
          <div className="skill-bar-meta">
            <span>{t('match.locationFit', { place: scorecard.location.label })}</span>
            <strong>{Math.round(scorecard.location.score || 0)}%</strong>
          </div>
          <div className="skill-bar-track" aria-hidden="true">
            <span style={{ width: `${Math.max(4, Math.min(100, scorecard.location.score || 0))}%` }} />
          </div>
        </div>
      ) : null}

      {skills.map((s) => (
        <div key={s.name} className={`skill-bar-row status-${s.status || 'missing'}`}>
          <div className="skill-bar-meta">
            <span>
              {s.name}
              {s.level ? <em> · {s.level}</em> : null}
            </span>
            <strong>{Math.round(s.score || 0)}%</strong>
          </div>
          <div className="skill-bar-track" aria-hidden="true">
            <span style={{ width: `${Math.max(3, Math.min(100, s.score || 0))}%` }} />
          </div>
        </div>
      ))}

      {!compact && scorecard.gaps?.length ? (
        <p className="skill-gap-note muted">
          {t('match.skillGapsNote', { skills: scorecard.gaps.slice(0, 3).join(', ') })}
        </p>
      ) : null}
    </div>
  )
}
