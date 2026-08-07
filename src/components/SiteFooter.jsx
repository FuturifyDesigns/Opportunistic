import { Link } from 'react-router-dom'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <strong>Opportunistic</strong>
          <p>Scholarships and jobs matched to your real qualifications — with reasons, not just lists.</p>
        </div>
        <div className="footer-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a href="mailto:hello@opportunistic.online">Contact</a>
        </div>
      </div>
      <div className="container footer-note">
        <p>
          Opportunistic surfaces third-party listings and is not the issuer of any scholarship or job. Always verify
          deadlines and eligibility on the source site.
        </p>
      </div>
    </footer>
  )
}
