import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireOnboarding = false }) {
  const { user, profile, loading } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()

  if (loading) {
    return (
      <div className="page-center">
        <div className="spinner" aria-label={t('common.loading')} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  if (requireOnboarding && profile && !profile.onboarding_complete) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
