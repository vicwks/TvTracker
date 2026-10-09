import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageContext.jsx';

// Accueil des visiteurs non connectés : présentation du site, fonctionnalités et questions fréquentes.
// Une seule H1 ; les sections sont en H2, les éléments en H3.
export default function Landing() {
  const { t } = useI18n();

  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:px-8 sm:pt-20">
        <header className="animate-rise max-w-3xl">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">{t('common.brand')}</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            {t('landing.headline')}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/75">{t('landing.intro')}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-md bg-signal px-5 py-3 text-sm font-medium text-signal-ink transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(245,165,36,0.7)] active:scale-[0.98]"
            >
              {t('landing.ctaRegister')}
            </Link>
            <Link
              to="/login"
              className="rounded-md border border-ink-line px-5 py-3 text-sm text-paper transition hover:border-signal hover:text-signal"
            >
              {t('landing.ctaLogin')}
            </Link>
          </div>
        </header>

        <section aria-labelledby="landing-features" className="mt-24">
          <h2 id="landing-features" className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            {t('landing.featuresTitle')}
          </h2>
          <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {t('landing.features').map((feature) => (
              <li key={feature.title} className="border-t border-ink-line pt-5">
                <h3 className="font-display text-xl text-paper">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="landing-faq" className="mt-24 max-w-3xl">
          <h2 id="landing-faq" className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
            {t('landing.faqTitle')}
          </h2>
          <div className="mt-8 divide-y divide-ink-line border-y border-ink-line">
            {t('landing.faq').map((item) => (
              <div key={item.q} className="py-5">
                <h3 className="font-display text-lg text-paper">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
