import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import LegalFolders from '../components/LegalFolders'
import { openCookiePreferences } from '../lib/consent'

export default function Privacy() {
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const section = new URLSearchParams(location.search).get('section') || 'overview'

  const items = useMemo(
    () => [
      {
        id: 'overview',
        title: t('privacyBody.overviewTitle'),
        content: <p>{t('privacyBody.overview')}</p>,
      },
      {
        id: 'lawful',
        title: t('privacyBody.lawfulTitle'),
        content: (
          <ul className="legal-list">
            <li>
              <strong>{t('privacyBody.lawfulContract')}</strong>
              <span>{t('privacyBody.lawfulContractDesc')}</span>
            </li>
            <li>
              <strong>{t('privacyBody.lawfulConsent')}</strong>
              <span>{t('privacyBody.lawfulConsentDesc')}</span>
            </li>
            <li>
              <strong>{t('privacyBody.lawfulLegitimate')}</strong>
              <span>{t('privacyBody.lawfulLegitimateDesc')}</span>
            </li>
            <li>
              <strong>{t('privacyBody.lawfulLegal')}</strong>
              <span>{t('privacyBody.lawfulLegalDesc')}</span>
            </li>
          </ul>
        ),
      },
      {
        id: 'store',
        title: t('privacyBody.storeTitle'),
        content: (
          <ul className="legal-list">
            <li>
              <strong>{t('privacyBody.storeAccount')}</strong>
              <span>{t('privacyBody.storeAccountDesc')}</span>
            </li>
            <li>
              <strong>{t('privacyBody.storeProfile')}</strong>
              <span>{t('privacyBody.storeProfileDesc')}</span>
            </li>
            <li>
              <strong>{t('privacyBody.storeMatches')}</strong>
              <span>{t('privacyBody.storeMatchesDesc')}</span>
            </li>
            <li>
              <strong>{t('privacyBody.storeTechnical')}</strong>
              <span>{t('privacyBody.storeTechnicalDesc')}</span>
            </li>
          </ul>
        ),
      },
      {
        id: 'cookies',
        title: t('privacyBody.cookiesTitle'),
        content: (
          <>
            <p>{t('privacyBody.cookiesIntro')}</p>
            <ul className="legal-list" style={{ marginTop: '0.85rem' }}>
              <li>
                <strong>{t('privacyBody.cookiesNecessary')}</strong>
                <span>{t('privacyBody.cookiesNecessaryDesc')}</span>
              </li>
              <li>
                <strong>{t('privacyBody.cookiesPreferences')}</strong>
                <span>{t('privacyBody.cookiesPreferencesDesc')}</span>
              </li>
              <li>
                <strong>{t('privacyBody.cookiesAnalytics')}</strong>
                <span>{t('privacyBody.cookiesAnalyticsDesc')}</span>
              </li>
              <li>
                <strong>{t('privacyBody.cookiesMarketing')}</strong>
                <span>{t('privacyBody.cookiesMarketingDesc')}</span>
              </li>
            </ul>
            <div className="legal-callout">
              <p>
                <button type="button" className="linkish" onClick={() => openCookiePreferences()}>
                  {t('privacyBody.cookiesOpenPrefs')}
                </button>{' '}
                {t('privacyBody.cookiesOrFooter')}
              </p>
            </div>
          </>
        ),
      },
      {
        id: 'use',
        title: t('privacyBody.useTitle'),
        content: <p>{t('privacyBody.useBody')}</p>,
      },
      {
        id: 'transfers',
        title: t('privacyBody.transfersTitle'),
        content: <p>{t('privacyBody.transfersBody')}</p>,
      },
      {
        id: 'retention',
        title: t('privacyBody.retentionTitle'),
        content: <p>{t('privacyBody.retentionBody')}</p>,
      },
      {
        id: 'rights',
        title: t('privacyBody.rightsTitle'),
        content: (
          <>
            <p>{t('privacyBody.rightsBody')}</p>
            <div className="legal-callout">
              <p>
                {t('privacyBody.rightsCalloutBefore')}{' '}
                <Link to="/settings">{t('nav.settings')}</Link>{' '}
                {t('privacyBody.rightsCalloutMid')}{' '}
                <a href="mailto:futurifydesigns@gmail.com">futurifydesigns@gmail.com</a>
              </p>
            </div>
          </>
        ),
      },
      {
        id: 'children',
        title: t('privacyBody.childrenTitle'),
        content: <p>{t('privacyBody.childrenBody')}</p>,
      },
      {
        id: 'sharing',
        title: t('privacyBody.sharingTitle'),
        content: <p>{t('privacyBody.sharingBody')}</p>,
      },
      {
        id: 'contact',
        title: t('privacyBody.contactTitle'),
        content: (
          <p>
            {t('privacyBody.contactBody')}{' '}
            <a href="mailto:futurifydesigns@gmail.com">futurifydesigns@gmail.com</a>
          </p>
        ),
      },
    ],
    [t, i18n.language],
  )

  useEffect(() => {
    document.title = t('privacy.metaTitle')
  }, [t, i18n.language])

  return (
    <div className="page legal-page">
      <SiteHeader />
      <main>
        <section className="legal-hero">
          <div className="container legal-hero-inner">
            <p className="eyebrow">{t('privacy.eyebrow')}</p>
            <h1>{t('privacy.title')}</h1>
            <p className="lede">{t('privacy.lede')}</p>
            <div className="legal-meta">
              <span className="info-chip">{t('privacy.updated')}</span>
              <Link className="legal-switch" to="/terms">
                {t('privacy.switchTerms')}
              </Link>
            </div>
            <p className="muted" style={{ marginTop: '0.75rem', maxWidth: '48ch' }}>
              {t('privacy.langNote')}
            </p>
          </div>
        </section>

        <LegalFolders items={items} initialId={section} />
      </main>
      <SiteFooter />
    </div>
  )
}
