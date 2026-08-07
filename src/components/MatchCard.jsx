export default function MatchCard({ match, kind, onSave, onDismiss, onOpen }) {
  const score = Math.round(Number(match.match_score) || 0)

  return (
    <article className="match-card">
      <button type="button" className="match-card-hit" onClick={() => onOpen?.(match)} aria-label={`Open ${match.title}`}>
        <div className="match-card-top">
          <div>
            <p className="eyebrow">{match.source || kind}</p>
            <h3>{match.title}</h3>
            {match.company ? <p className="muted">{match.company}</p> : null}
          </div>
          <div className="score-pill" title="Match score">
            {score}%
          </div>
        </div>
        <p className="reasoning">{match.reasoning}</p>
        <div className="match-meta">
          {match.deadline ? <span>Deadline: {match.deadline}</span> : <span>Rolling / check source</span>}
          <span>Found {new Date(match.found_at || Date.now()).toLocaleDateString()}</span>
        </div>
      </button>

      <div className="match-actions">
        <a className="btn btn-sm" href={match.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
          Open listing
        </a>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSave?.(match)}>
          {match.saved ? 'Saved' : 'Save'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDismiss?.(match)}>
          Dismiss
        </button>
      </div>
    </article>
  )
}
