import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageContext.jsx';

// Page affichée pour une adresse inconnue. Non indexée (voir seo/meta.js).
export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[70dvh] items-center bg-ink font-ui text-paper">
      <div className="mx-auto w-full max-w-2xl px-6 py-20 sm:px-8">
        <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">404</p>
        <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
          {t('notFound.title')}
        </h1>
        <p className="mt-4 text-ink-muted">{t('notFound.text')}</p>
        <Link to="/" className="mt-8 inline-block text-signal underline-offset-4 hover:underline">
          {t('notFound.back')}
        </Link>
      </div>
    </div>
  );
}
