import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  acceptAll,
  applyConsent,
  getConsent,
  hasConsentDecision,
  rejectOptional,
  saveConsent,
} from '../lib/consent'

const ConsentContext = createContext(null)

export function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => getConsent())
  const [bannerOpen, setBannerOpen] = useState(() => !hasConsentDecision())
  const [prefsOpen, setPrefsOpen] = useState(false)

  useEffect(() => {
    applyConsent(consent)
    const onConsent = (e) => setConsent(e.detail)
    const onOpen = () => {
      setPrefsOpen(true)
      setBannerOpen(false)
    }
    window.addEventListener('opp:consent', onConsent)
    window.addEventListener('opp:open-cookies', onOpen)
    return () => {
      window.removeEventListener('opp:consent', onConsent)
      window.removeEventListener('opp:open-cookies', onOpen)
    }
  }, [consent])

  const acceptEverything = useCallback(() => {
    const next = acceptAll()
    setConsent(next)
    setBannerOpen(false)
    setPrefsOpen(false)
  }, [])

  const rejectExtras = useCallback(() => {
    const next = rejectOptional()
    setConsent(next)
    setBannerOpen(false)
    setPrefsOpen(false)
  }, [])

  const savePrefs = useCallback((partial) => {
    const next = saveConsent(partial)
    setConsent(next)
    setBannerOpen(false)
    setPrefsOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      consent,
      bannerOpen,
      prefsOpen,
      setBannerOpen,
      setPrefsOpen,
      acceptEverything,
      rejectExtras,
      savePrefs,
      openPreferences: () => {
        setPrefsOpen(true)
        setBannerOpen(false)
      },
    }),
    [consent, bannerOpen, prefsOpen, acceptEverything, rejectExtras, savePrefs],
  )

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent() {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider')
  return ctx
}
