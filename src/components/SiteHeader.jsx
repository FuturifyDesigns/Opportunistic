import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SiteHeader() {
  const { user, signOut } = useAuth()

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="Opportunistic home">
          <img src={`${import.meta.env.BASE_URL}mark.svg`} alt="" className="brand-mark" width="28" height="28" />
          <span>Opportunistic</span>
        </Link>

        <nav className="nav">
          {!user ? (
            <>
              <a href="#how">How it works</a>
              <NavLink to="/auth">Sign in</NavLink>
              <NavLink to="/auth?mode=signup" className="btn btn-sm">
                Get started
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/profile">Profile</NavLink>
              <NavLink to="/settings">Settings</NavLink>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => signOut()}>
                Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
