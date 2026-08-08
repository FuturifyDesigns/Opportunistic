import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { isAdminEmail } from '../lib/analytics'

/** Only futurifydesigns@gmail.com can open admin routes. */
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
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

  if (!isAdminEmail(user.email)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
