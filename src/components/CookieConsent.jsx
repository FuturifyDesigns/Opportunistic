import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConsent } from '../context/ConsentContext'

export default function CookieConsent() {
  const { t } = useTranslation()
  const {
    consent,
    bannerOpen,
    prefsOpen,
    setBannerOpen,
    setPrefsOpen,
    acceptEverything,
    rejectExtras,
    savePrefs,
  } = useConsent()

  const [draft, setDraft] = useState({
    preferences: false,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    if (prefsOpen) {
      setDraft({
        preferences: Boolean(consent?.preferences),
        analytics: Boolean(consent?.analytics),
        marketing: Boolean(consent?.marketing),
      })
    }
  }, [prefsOpen, consent])

  if (!bannerOpen && !prefsOpen) return null

  return (
    <>
      {bannerOpen ? (
        <div className="cookie-banner" role="dialog" aria-label={t('cookies.title')} aria-live="polite">
          <div className="cookie-banner-inner">
            <div className="cookie-banner-copy">
              <p className="jarvis-caption">{t('cookies.caption')}</p>
              <h2 className="cookie-title">{t('cookies.title')}</h2>
              <p>
                {t('cookies.body')}{' '}
                <Link to="/privacy?section=cookies">{t('cookies.policyLink')}</Link>
              </p>
            </div>
            <div className="cookie-banner-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={rejectExtras}>
                {t('cookies.necessaryOnly')}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setPrefsOpen(true)
                  setBannerOpen(false)
                }}
              >
                {t('cookies.customize')}
              </button>
              <button type="button" className="btn btn-sm" onClick={acceptEverything}>
                {t('cookies.acceptAll')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {prefsOpen ? (
        <div className="cookie-modal-backdrop" role="presentation" onClick={() => setPrefsOpen(false)}>
          <div
            className="cookie-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-prefs-title"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="jarvis-caption">{t('cookies.prefsCaption')}</p>
            <h2 id="cookie-prefs-title">{t('cookies.prefsTitle')}</h2>
            <p className="muted">{t('cookies.prefsBody')}</p>

            <div className="cookie-cats">
              <label className="cookie-cat locked">
                <input type="checkbox" checked disabled readOnly />
                <span>
                  <strong>{t('cookies.necessary')}</strong>
                  <em>{t('cookies.necessaryDesc')}</em>
                </span>
              </label>
              <label className="cookie-cat">
                <input
                  type="checkbox"
                  checked={draft.preferences}
                  onChange={(e) => setDraft((d) => ({ ...d, preferences: e.target.checked }))}
                />
                <span>
                  <strong>{t('cookies.preferences')}</strong>
                  <em>{t('cookies.preferencesDesc')}</em>
                </span>
              </label>
              <label className="cookie-cat">
                <input
                  type="checkbox"
                  checked={draft.analytics}
                  onChange={(e) => setDraft((d) => ({ ...d, analytics: e.target.checked }))}
                />
                <span>
                  <strong>{t('cookies.analytics')}</strong>
                  <em>{t('cookies.analyticsDesc')}</em>
                </span>
              </label>
              <label className="cookie-cat">
                <input
                  type="checkbox"
                  checked={draft.marketing}
                  onChange={(e) => setDraft((d) => ({ ...d, marketing: e.target.checked }))}
                />
                <span>
                  <strong>{t('cookies.marketing')}</strong>
                  <em>{t('cookies.marketingDesc')}</em>
                </span>
              </label>
            </div>

            <div className="cookie-modal-actions">
              <button type="button" className="btn btn-ghost" onClick={rejectExtras}>
                {t('cookies.necessaryOnly')}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  savePrefs({
                    preferences: draft.preferences,
                    analytics: draft.analytics,
                    marketing: draft.marketing,
                  })
                }
              >
                {t('cookies.saveChoices')}
              </button>
            </div>
            <p className="cookie-legal-note">
              {t('cookies.details')}: <Link to="/privacy?section=cookies">{t('nav.privacy')} · {t('nav.cookies')}</Link> ·{' '}
              <Link to="/privacy?section=rights">{t('legal.privacyTitle')}</Link>
            </p>
          </div>
        </div>
      ) : null}
    </>
  )
}
