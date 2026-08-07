import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SiteHeader() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <header className="site-header">
      <div className="container header-inner">
        <NavLink to="/" className="brand" aria-label="Opportunistic home" onClick={close} end>
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt=""
            className="brand-mark"
            width="36"
            height="36"
          />
          <span className="brand-word">Opportunistic</span>
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
          <NavLink to="/how-it-works" onClick={close}>
            How it works
          </NavLink>
          <NavLink to="/features" onClick={close}>
            Features
          </NavLink>
          <NavLink to="/about" onClick={close}>
            About
          </NavLink>

          {user ? (
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
          ) : (
            <NavLink to="/auth?mode=signup" className="btn btn-sm" onClick={close}>
              Get started
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
