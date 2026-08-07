import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Restore deep links after GitHub Pages 404 → index redirect
const redirect = sessionStorage.getItem('opportunistic-redirect')
if (redirect) {
  sessionStorage.removeItem('opportunistic-redirect')
  const base = '/Opportunistic'
  if (redirect.startsWith(base) && redirect !== `${base}/` && redirect !== base) {
    window.history.replaceState(null, '', redirect)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
