import { NavLink } from 'react-router-dom'

/** Futuristic glitch / synth Get started mark */
export default function GetStartedLogo({ onClick }) {
  const src = `${import.meta.env.BASE_URL}logo.png`

  return (
    <NavLink
      to="/auth?mode=signup"
      className="nav-start-logo"
      onClick={onClick}
      aria-label="Get started"
      title="Get started"
    >
      <span className="glitch-mark" aria-hidden="true">
        <img className="glitch-base" src={src} alt="" width="52" height="52" />
        <img className="glitch-layer glitch-cyan" src={src} alt="" width="52" height="52" />
        <img className="glitch-layer glitch-lime" src={src} alt="" width="52" height="52" />
        <span className="glitch-scan" />
      </span>
    </NavLink>
  )
}
