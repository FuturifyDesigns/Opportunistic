import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from './context/AuthContext'
import { ConsentProvider } from './context/ConsentContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import GlitchHeadings from './components/GlitchHeadings'
import CookieConsent from './components/CookieConsent'
import Landing from './pages/Landing'
import Intro from './pages/Intro'
import HowItWorks from './pages/HowItWorks'
import Features from './pages/Features'
import About from './pages/About'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import MatchDetail from './pages/MatchDetail'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

function AppRoutes() {
  const { i18n } = useTranslation()
  // Remount route tree on language change so every page updates instantly.
  return (
    <Routes key={i18n.language}>
      <Route path="/" element={<Intro />} />
      <Route path="/home" element={<Landing />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/features" element={<Features />} />
      <Route path="/about" element={<About />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireOnboarding>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute requireOnboarding>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requireOnboarding>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/match/:kind/:id"
        element={
          <ProtectedRoute requireOnboarding>
            <MatchDetail />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ConsentProvider>
        <ToastProvider>
          <BrowserRouter>
            <GlitchHeadings />
            <CookieConsent />
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </ConsentProvider>
    </AuthProvider>
  )
}
