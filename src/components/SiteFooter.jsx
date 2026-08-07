import { Link } from 'react-router-dom'
import { openCookiePreferences } from '../lib/consent'

const year = new Date().getFullYear()

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" className="footer-logo" aria-label="Opportunistic home">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width="44" height="44" />
            <span>
              Opportunistic<sup>™</sup>
            </span>
          </Link>
          <p>Scholarships and jobs matched to your qualifications — with reasons on every card.</p>
        </div>

        <nav className="footer-nav" aria-label="Footer">
          <div className="footer-col">
            <p className="footer-label">Product</p>
            <Link to="/how-it-works">How it works</Link>
            <Link to="/features">Features</Link>
            <Link to="/about">About</Link>
          </div>
          <div className="footer-col">
            <p className="footer-label">Legal</p>
            <Link to="/privacy?section=overview">Privacy</Link>
            <Link to="/privacy?section=cookies">Cookies</Link>
            <Link to="/terms?section=role">Terms</Link>
            <button type="button" className="footer-linkish" onClick={() => openCookiePreferences()}>
              Cookie settings
            </button>
          </div>
        </nav>
      </div>

      <div className="container footer-bar">
        <p className="footer-copy">
          © {year} Opportunistic<sup>™</sup>. All rights reserved.
        </p>
        <p className="footer-built">
          Built by{' '}
          <a href="https://futurifydesigns.com" target="_blank" rel="noreferrer">
            Futurify Designs
          </a>
        </p>
      </div>

      <div className="container footer-disclaimer">
        <p>
          Opportunistic™ surfaces third-party listings and is not the issuer of any scholarship or job. Verify deadlines
          and eligibility on the source site. We apply a GDPR-style privacy baseline globally; cookie and analytics tools
          load only with your consent.
        </p>
      </div>
    </footer>
  )
}
