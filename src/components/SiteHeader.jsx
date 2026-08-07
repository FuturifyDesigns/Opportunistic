import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SiteHeader() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="Opportunistic home" onClick={close}>
          <img src={`${import.meta.env.BASE_URL}mark.svg`} alt="" className="brand-mark" width="28" height="28" />
          <span>Opportunistic</span>
        </Link>

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
              <NavLink to="/auth" onClick={close}>
                Sign in
              </NavLink>
              <NavLink to="/auth?mode=signup" className="btn btn-sm" onClick={close}>
                Get started
              </NavLink>
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
