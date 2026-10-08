import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/LanguageContext.jsx';

// Pages légales : conditions générales d'utilisation et mentions légales.
// Ce sont des brouillons. Les informations propres à l'éditeur (identité, adresse, hébergeur, droit applicable)
// sont entre crochets, en ambre, et restent à compléter avant une mise en ligne publique.
// Les textes viennent du dictionnaire (fr.js / en.js). Marqueurs : [[à compléter]] et <<libellé|/chemin>>.
const RICH_TOKEN = /(\[\[[^\]]+\]\]|<<[^>|]+\|[^>]+>>)/;

function Rich({ text }) {
  return text.split(RICH_TOKEN).map((part, i) => {
    if (part.startsWith('[[')) return <Placeholder key={i}>{part.slice(2, -2)}</Placeholder>;
    if (part.startsWith('<<')) {
      const [label, to] = part.slice(2, -2).split('|');
      return (
        <Link key={i} to={to} className="text-signal underline-offset-4 hover:underline">
          {label}
        </Link>
      );
    }
    return part;
  });
}

function Placeholder({ children }) {
  return <span className="rounded-sm bg-signal/15 px-1 text-signal">[{children}]</span>;
}

function LegalPage({ title, notice, children }) {
  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8 sm:py-20">
        <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">TV Tracker</p>
        <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">{title}</h1>

        <div className="mt-8 border-l-2 border-signal pl-4 text-sm leading-relaxed text-ink-muted">{notice}</div>

        <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-paper/85">{children}</div>
      </div>
    </div>
  );
}

function LegalSection({ section }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-medium text-paper">{section.title}</h2>
      <div className="mt-3 space-y-3">
        {section.paragraphs?.map((paragraph, i) => (
          <p key={i}>
            <Rich text={paragraph} />
          </p>
        ))}
        {section.items && (
          <ul className="space-y-2">
            {section.items.map((item, i) => (
              <li key={i}>
                <Rich text={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function Cgu() {
  const { t } = useI18n();
  return (
    <LegalPage title={t('legal.cgu.title')} notice={t('legal.notice')}>
      {t('legal.cgu.sections').map((section) => (
        <LegalSection key={section.title} section={section} />
      ))}
    </LegalPage>
  );
}

export function MentionsLegales() {
  const { t } = useI18n();
  return (
    <LegalPage title={t('legal.mentions.title')} notice={t('legal.notice')}>
      {t('legal.mentions.sections').map((section) => (
        <LegalSection key={section.title} section={section} />
      ))}
    </LegalPage>
  );
}
