import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GetStartedLogo from './GetStartedLogo'

export default function SiteHeader() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <header className="site-header">
      <div className="container header-inner">
        <NavLink to="/" className="brand" aria-label="Opportunistic home" onClick={close} end>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Opportunistic" className="brand-logo" />
        </NavLink>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>

        <nav className={`nav ${open ? 'open' : ''}`}>
          {!user ? (
            <>
              <NavLink to="/how-it-works" onClick={close}>
                How it works
              </NavLink>
              <NavLink to="/features" onClick={close}>
                Features
              </NavLink>
              <NavLink to="/about" onClick={close}>
                About
              </NavLink>
              <GetStartedLogo onClick={close} />
            </>
          ) : (
            <>
              <NavLink to="/dashboard" onClick={close}>
                Dashboard
              </NavLink>
              <NavLink to="/profile" onClick={close}>
                Profile
              </NavLink>
              <NavLink to="/settings" onClick={close}>
                Settings
              </NavLink>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  close()
                  signOut()
                }}
              >
                Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
