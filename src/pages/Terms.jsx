import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import LegalFolders from '../components/LegalFolders'

export default function Terms() {
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const section = new URLSearchParams(location.search).get('section') || 'role'

  const items = useMemo(
    () => [
      {
        id: 'role',
        title: t('termsBody.roleTitle'),
        content: (
          <>
            <p>{t('termsBody.roleBody')}</p>
            <div className="legal-callout">
              <p>{t('termsBody.roleCallout')}</p>
            </div>
          </>
        ),
      },
      {
        id: 'accuracy',
        title: t('termsBody.accuracyTitle'),
        content: <p>{t('termsBody.accuracyBody')}</p>,
      },
      {
        id: 'account',
        title: t('termsBody.accountTitle'),
        content: (
          <ul className="legal-list">
            <li>
              <strong>{t('termsBody.accountAccuracy')}</strong>
              <span>{t('termsBody.accountAccuracyDesc')}</span>
            </li>
            <li>
              <strong>{t('termsBody.accountOthers')}</strong>
              <span>{t('termsBody.accountOthersDesc')}</span>
            </li>
            <li>
              <strong>{t('termsBody.accountFair')}</strong>
              <span>{t('termsBody.accountFairDesc')}</span>
            </li>
          </ul>
        ),
      },
      {
        id: 'liability',
        title: t('termsBody.liabilityTitle'),
        content: <p>{t('termsBody.liabilityBody')}</p>,
      },
      {
        id: 'privacy',
        title: t('termsBody.privacyTitle'),
        content: (
          <p>
            {t('termsBody.privacyBefore')}{' '}
            <Link to="/privacy">{t('termsBody.privacyLink')}</Link>{' '}
            {t('termsBody.privacyAfter')}{' '}
            <Link to="/privacy?section=cookies">{t('termsBody.privacyCookiesLink')}</Link>{' '}
            {t('termsBody.privacyEnd')}
          </p>
        ),
      },
      {
        id: 'changes',
        title: t('termsBody.changesTitle'),
        content: <p>{t('termsBody.changesBody')}</p>,
      },
      {
        id: 'contact',
        title: t('termsBody.contactTitle'),
        content: (
          <p>
            {t('termsBody.contactBody')}{' '}
            <a href="mailto:futurifydesigns@gmail.com">futurifydesigns@gmail.com</a>
          </p>
        ),
      },
    ],
    [t, i18n.language],
  )

  useEffect(() => {
    document.title = t('terms.metaTitle')
  }, [t, i18n.language])

  return (
    <div className="page legal-page">
      <SiteHeader />
      <main>
        <section className="legal-hero">
          <div className="container legal-hero-inner">
            <p className="eyebrow">{t('terms.eyebrow')}</p>
            <h1>{t('terms.title')}</h1>
            <p className="lede">{t('terms.lede')}</p>
            <div className="legal-meta">
              <span className="info-chip">{t('terms.updated')}</span>
              <Link className="legal-switch" to="/privacy">
                {t('terms.switchPrivacy')}
              </Link>
            </div>
          </div>
        </section>

        <LegalFolders items={items} initialId={section} />
      </main>
      <SiteFooter />
    </div>
  )
}
