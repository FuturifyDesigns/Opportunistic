import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { openCookiePreferences } from '../lib/consent'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export default function Settings() {
  const { user, signOut } = useAuth()
  const toast = useToast()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = t('settings.docTitle')
  }, [t])

  async function deleteAccount() {
    const ok = await toast.confirm({
      title: t('settings.deleteData'),
      message: t('settings.deleteConfirm'),
      confirmLabel: t('settings.deleteData'),
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await Promise.all([
        supabase.from('scholarship_matches').delete().eq('user_id', user.id),
        supabase.from('job_matches').delete().eq('user_id', user.id),
        supabase.from('qualifications').delete().eq('user_id', user.id),
        supabase.from('skills').delete().eq('user_id', user.id),
        supabase.from('search_runs').delete().eq('user_id', user.id),
        supabase.from('profiles').delete().eq('user_id', user.id),
      ])
      toast.success(t('settings.deleted'))
      await signOut()
      navigate('/home')
    } catch (err) {
      toast.error(err.message || t('common.toast.genericError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <SiteHeader />
      <main className="container narrow">
        <p className="eyebrow">{t('nav.settings')}</p>
        <h1>{t('settings.title')}</h1>

        <div className="stack-form">
          <h2 className="form-section">{t('settings.privacyCookies')}</h2>
          <p className="muted">{t('settings.privacyCookiesBody')}</p>
          <button type="button" className="btn btn-ghost" onClick={() => openCookiePreferences()}>
            {t('nav.cookieSettings')}
          </button>

          <hr className="divider" />

          <h2 className="form-section">{t('settings.dangerZone')}</h2>
          <p className="muted">{t('settings.dangerBody')}</p>
          <button type="button" className="btn btn-danger" disabled={busy} onClick={deleteAccount}>
            {t('settings.deleteData')}
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
