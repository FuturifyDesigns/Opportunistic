import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import PageBackdrop from '../components/PageBackdrop'

export default function EmailVerified() {
  const { t } = useTranslation()
  const { loading } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = `${t('auth.verifiedTitle')} — Opportunistic`
  }, [t])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const fromSearch =
      url.searchParams.get('error_description') || url.searchParams.get('error')
    const hash = url.hash?.replace(/^#/, '')
    const hp = hash ? new URLSearchParams(hash) : null
    const fromHash = hp?.get('error_description') || hp?.get('error')
    const raw = fromSearch || fromHash
    if (raw) {
      setError(decodeURIComponent(String(raw).replace(/\+/g, ' ')))
    }
  }, [])

  return (
    <PageBackdrop image="auth.jpg" className="verified-page">
      <main className="verified-main">
        <p className="eyebrow">{t('common.brand')}</p>
        {loading ? (
          <div className="spinner" aria-label={t('common.loading')} />
        ) : error ? (
          <>
            <h1>{t('auth.verifiedErrorTitle')}</h1>
            <p className="lede">{error}</p>
          </>
        ) : (
          <>
            <h1>{t('auth.verifiedTitle')}</h1>
            <p className="lede">{t('auth.verifiedBody')}</p>
          </>
        )}
      </main>
    </PageBackdrop>
  )
}
