import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Restore deep links after GitHub Pages 404 → index redirect
const redirect = sessionStorage.getItem('opportunistic-redirect')
if (redirect) {
  sessionStorage.removeItem('opportunistic-redirect')
  if (redirect !== '/' && !redirect.startsWith('/Opportunistic')) {
    window.history.replaceState(null, '', redirect)
  } else if (redirect.startsWith('/Opportunistic')) {
    // Legacy project-path bookmarks → strip prefix on custom domain
    const stripped = redirect.replace(/^\/Opportunistic/, '') || '/'
    window.history.replaceState(null, '', stripped)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
