import { useI18n } from '../i18n/LanguageContext.jsx';

const LANGS = ['fr', 'en'];

// Bascule FR / EN, affichée dans la barre de navigation et sur les pages d'accès.
export default function LanguageSwitch({ className = '' }) {
  const { lang, setLang, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className={`inline-flex items-center gap-1 font-ui text-xs ${className}`}
    >
      {LANGS.map((code, i) => (
        <span key={code} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden="true" className="text-ink-line">|</span>}
          <button
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={lang === code}
            title={t(`language.${code}`)}
            className={`rounded px-1.5 py-0.5 font-medium uppercase tracking-[0.15em] transition ${
              lang === code ? 'text-signal' : 'text-ink-muted hover:text-paper'
            }`}
          >
            {code}
          </button>
        </span>
      ))}
    </div>
  );
}
