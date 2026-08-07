import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import GetStartedLogo from './GetStartedLogo'
import LanguageSwitcher from './LanguageSwitcher'

export default function SiteHeader() {
  const { user, signOut } = useAuth()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <header className="site-header">
      <div className="container header-inner">
        <NavLink to="/" className="brand" aria-label={`${t('common.brand')} ${t('common.home')}`} onClick={close} end>
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
          onClick={() => setOpen((v) => !v)}
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

          <LanguageSwitcher compact />

          {user ? (
            <>
              <NavLink to="/dashboard" onClick={close}>
                {t('nav.dashboard')}
              </NavLink>
              <NavLink to="/profile" onClick={close}>
                {t('nav.profile')}
              </NavLink>
              <NavLink to="/settings" onClick={close}>
                {t('nav.settings')}
              </NavLink>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  close()
                  signOut()
                }}
              >
                {t('nav.signOut')}
              </button>
            </>
          ) : (
            <GetStartedLogo onClick={close} />
          )}
        </nav>
      </div>
    </header>
  )
}
