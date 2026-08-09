import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageBackdrop from '../components/PageBackdrop'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export default function NotFound() {
  const { t } = useTranslation()

  useEffect(() => {
    document.title = `${t('notFound.title')} — Opportunistic`
  }, [t])

  return (
    <PageBackdrop image="auth.jpg" className="not-found-page">
      <SiteHeader />
      <main className="not-found-main">
        <p className="eyebrow" aria-hidden="true">
          404
        </p>
        <h1>{t('notFound.title')}</h1>
        <p className="lede">{t('notFound.body')}</p>
        <div className="cta-row">
          <Link className="btn primary" to="/home">
            {t('notFound.home')}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </PageBackdrop>
  )
}
