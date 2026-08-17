import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

const year = new Date().getFullYear()

export default function SiteFooter() {
  const { t } = useTranslation()

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/home" className="footer-logo" aria-label={`${t('common.brand')} ${t('common.home')}`}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width="44" height="44" />
            <span>
              {t('common.brand')}
              <sup>™</sup>
            </span>
          </Link>
          <p>{t('footer.tagline')}</p>
          <div className="footer-lang">
            <LanguageSwitcher />
          </div>
        </div>

        <nav className="footer-nav" aria-label={t('common.footerNav')}>
          <div className="footer-col">
            <p className="footer-label">{t('nav.product')}</p>
            <Link to="/how-it-works">{t('nav.howItWorks')}</Link>
            <Link to="/features">{t('nav.features')}</Link>
            <Link to="/about">{t('nav.about')}</Link>
          </div>
          <div className="footer-col">
            <p className="footer-label">{t('nav.legal')}</p>
            <Link to="/privacy?section=overview">{t('nav.privacy')}</Link>
            <Link to="/terms?section=role">{t('nav.terms')}</Link>
          </div>
        </nav>
      </div>

      <div className="container footer-bar">
        <p className="footer-copy">
          © {year} {t('common.brand')}
          <sup>™</sup>. {t('common.allRights')}
        </p>
        <p className="footer-built">
          {t('common.builtBy')}{' '}
          <a href="https://futurifydesigns.com" target="_blank" rel="noreferrer">
            Futurify Designs
          </a>
        </p>
      </div>

      <div className="container footer-disclaimer">
        <p>{t('footer.disclaimer')}</p>
      </div>
    </footer>
  )
}
