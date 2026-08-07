import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useConsent } from '../context/ConsentContext'

export default function CookieConsent() {
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
        <div className="cookie-banner" role="dialog" aria-label="Cookie consent" aria-live="polite">
          <div className="cookie-banner-inner">
            <div className="cookie-banner-copy">
              <p className="jarvis-caption">Privacy controls</p>
              <h2 className="cookie-title">Cookies & data use</h2>
              <p>
                We use necessary cookies to keep you signed in and remember this choice. Optional cookies help preferences,
                analytics, and marketing — only if you allow them. Aligns with GDPR-style rights worldwide.{' '}
                <Link to="/privacy?section=cookies">Cookie policy</Link>
              </p>
            </div>
            <div className="cookie-banner-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={rejectExtras}>
                Necessary only
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setPrefsOpen(true)
                  setBannerOpen(false)
                }}
              >
                Customize
              </button>
              <button type="button" className="btn btn-sm" onClick={acceptEverything}>
                Accept all
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
            <p className="jarvis-caption">Preferences</p>
            <h2 id="cookie-prefs-title">Cookie settings</h2>
            <p className="muted">
              Change anytime. Necessary cookies can’t be turned off — they power auth, security, and storing this choice.
            </p>

            <div className="cookie-cats">
              <label className="cookie-cat locked">
                <input type="checkbox" checked disabled readOnly />
                <span>
                  <strong>Necessary</strong>
                  <em>Sign-in session, security, consent record</em>
                </span>
              </label>
              <label className="cookie-cat">
                <input
                  type="checkbox"
                  checked={draft.preferences}
                  onChange={(e) => setDraft((d) => ({ ...d, preferences: e.target.checked }))}
                />
                <span>
                  <strong>Preferences</strong>
                  <em>Remember UI choices beyond the consent cookie</em>
                </span>
              </label>
              <label className="cookie-cat">
                <input
                  type="checkbox"
                  checked={draft.analytics}
                  onChange={(e) => setDraft((d) => ({ ...d, analytics: e.target.checked }))}
                />
                <span>
                  <strong>Analytics</strong>
                  <em>Understand usage (loaded only after you opt in)</em>
                </span>
              </label>
              <label className="cookie-cat">
                <input
                  type="checkbox"
                  checked={draft.marketing}
                  onChange={(e) => setDraft((d) => ({ ...d, marketing: e.target.checked }))}
                />
                <span>
                  <strong>Marketing</strong>
                  <em>Ads / remarketing tags — never without consent</em>
                </span>
              </label>
            </div>

            <div className="cookie-modal-actions">
              <button type="button" className="btn btn-ghost" onClick={rejectExtras}>
                Necessary only
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
                Save choices
              </button>
            </div>
            <p className="cookie-legal-note">
              Details: <Link to="/privacy?section=cookies">Privacy · Cookies</Link> ·{' '}
              <Link to="/privacy?section=rights">Your rights</Link>
            </p>
          </div>
        </div>
      ) : null}
    </>
  )
}
