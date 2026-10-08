import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../i18n/LanguageContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  if (loading) return <p className="bg-ink p-8 font-ui text-ink-muted">{t('common.loading')}</p>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
