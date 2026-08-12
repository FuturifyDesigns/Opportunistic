import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isAdminEmail } from '../lib/analytics'
import GetStartedLogo from './GetStartedLogo'
import LanguageSwitcher from './LanguageSwitcher'

export default function SiteHeader() {
  const { user, profile, signOut } = useAuth()
  const toast = useToast()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)
  const showAdmin = isAdminEmail(user?.email)

  const close = () => {
    setOpen(false)
    setAccountOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!accountOpen) return
    const onDoc = (e) => {
      if (!accountRef.current?.contains(e.target)) setAccountOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [accountOpen])

  const firstName = profile?.full_name?.trim()?.split(/\s+/)[0] || user?.email?.split('@')[0] || t('common.brand')

  return (
    <header className="site-header">
      <div className="container header-inner">
        <NavLink to="/home" className="brand" aria-label={`${t('common.brand')} ${t('common.home')}`} onClick={close} end>
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt=""
            className="brand-mark"
            width="56"
            height="56"
          />
          <span className="brand-word">{t('common.brand')}</span>
        </NavLink>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-label={t('common.menu')}
          onClick={() => {
            setAccountOpen(false)
            setOpen((v) => !v)
          }}
        >
          <span />
          <span />
        </button>

        <nav className={`nav ${open ? 'open' : ''}`}>
          <NavLink to="/how-it-works" onClick={close}>
            {t('nav.howItWorks')}
          </NavLink>
          <NavLink to="/features" onClick={close}>
            {t('nav.features')}
          </NavLink>
          <NavLink to="/about" onClick={close}>
            {t('nav.about')}
          </NavLink>

          <LanguageSwitcher compact onPick={close} />

          {user ? (
            <>
              <div className={`account-menu account-menu-desktop ${accountOpen ? 'open' : ''}`} ref={accountRef}>
                <button
                  type="button"
                  className="account-menu-trigger"
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                  aria-label={t('nav.dashboard')}
                  title={firstName}
                  onClick={() => setAccountOpen((v) => !v)}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}logo.png`}
                    alt=""
                    width="40"
                    height="40"
                  />
                </button>

                {accountOpen ? (
                  <div className="account-menu-panel" role="menu">
                    <p className="account-menu-label">{firstName}</p>
                    <NavLink role="menuitem" to="/dashboard" onClick={close}>
                      {t('nav.dashboard')}
                    </NavLink>
                    <NavLink role="menuitem" to="/hub" onClick={close}>
                      {t('nav.hub')}
                    </NavLink>
                    <NavLink role="menuitem" to="/profile" onClick={close}>
                      {t('nav.profile')}
                    </NavLink>
                    <NavLink role="menuitem" to="/settings" onClick={close}>
                      {t('nav.settings')}
                    </NavLink>
                    {showAdmin ? (
                      <NavLink role="menuitem" to="/admin" onClick={close} className="account-admin-link">
                        Admin
                      </NavLink>
                    ) : null}
                    <button
                      type="button"
                      role="menuitem"
                      className="account-menu-signout"
                      onClick={() => {
                        close()
                        void signOut().then(() => toast.info(t('common.toast.signedOut')))
                      }}
                    >
                      {t('nav.signOut')}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="account-links-mobile">
                <p className="account-menu-label">{firstName}</p>
                <NavLink to="/dashboard" onClick={close}>
                  {t('nav.dashboard')}
                </NavLink>
                <NavLink to="/hub" onClick={close}>
                  {t('nav.hub')}
                </NavLink>
                <NavLink to="/profile" onClick={close}>
                  {t('nav.profile')}
                </NavLink>
                <NavLink to="/settings" onClick={close}>
                  {t('nav.settings')}
                </NavLink>
                {showAdmin ? (
                  <NavLink to="/admin" onClick={close} className="account-admin-link">
                    Admin
                  </NavLink>
                ) : null}
                <button
                  type="button"
                  className="account-menu-signout"
                  onClick={() => {
                    close()
                    void signOut().then(() => toast.info(t('common.toast.signedOut')))
                  }}
                >
                  {t('nav.signOut')}
                </button>
              </div>
            </>
          ) : (
            <GetStartedLogo onClick={close} />
          )}
        </nav>
      </div>
    </header>
  )
}
