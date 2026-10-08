// Pages légales : conditions générales d'utilisation et mentions légales.
// Ce sont des brouillons. Les informations propres à l'éditeur (identité, adresse, hébergeur, droit applicable)
// s'écrivent entre crochets, en ambre : elles restent à compléter avant une mise en ligne publique.

function Placeholder({ children }) {
  return <span className="rounded-sm bg-signal/15 px-1 text-signal">[{children}]</span>;
}

function LegalPage({ title, children }) {
  return (
    <div className="min-h-[70dvh] bg-ink font-ui text-paper">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8 sm:py-20">
        <p className="text-xs uppercase tracking-[0.25em] text-ink-muted">TV Tracker</p>
        <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">{title}</h1>

        <div className="mt-8 border-l-2 border-signal pl-4 text-sm leading-relaxed text-ink-muted">
          Texte provisoire. À relire et à compléter avant toute mise en ligne publique. Les informations entre crochets
          restent à renseigner.
        </div>

        <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-paper/85">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-medium text-paper">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function Cgu() {
  return (
    <LegalPage title="Conditions générales d'utilisation">
      <Section title="1. Objet">
        <p>
          TV Tracker permet de suivre les séries et les films que l'on regarde : statut, épisodes vus, notes, liste à
          voir et calendrier des prochains épisodes. Les présentes conditions encadrent l'accès et l'utilisation du
          service.
        </p>
      </Section>

      <Section title="2. Accès et compte">
        <p>
          La création d'un compte demande une adresse email valide, un pseudo unique (3 à 20 caractères : lettres,
          chiffres et underscore) et un mot de passe d'au moins 8 caractères. Chaque adresse email ne peut servir qu'à un
          seul compte.
        </p>
        <p>
          Tu es responsable de la confidentialité de tes identifiants. Signale-nous tout usage non autorisé de ton
          compte à l'adresse indiquée dans les mentions légales.
        </p>
      </Section>

      <Section title="3. Utilisation">
        <p>
          Le service est destiné à un usage personnel et non commercial. Il est interdit de porter atteinte au
          fonctionnement du service, de l'automatiser de manière abusive, d'usurper l'identité d'une autre personne ou
          d'y publier des contenus illicites.
        </p>
      </Section>

      <Section title="4. Données personnelles">
        <p>
          Nous collectons l'adresse email, le pseudo, le mot de passe et les données de suivi que tu saisis (séries,
          épisodes, notes, amis). Le mot de passe n'est jamais conservé en clair : il est haché.
        </p>
        <p>
          Les données servent uniquement au fonctionnement du service. Tu peux demander l'accès, la rectification ou la
          suppression de tes données à l'adresse indiquée dans les mentions légales.{' '}
          <Placeholder>durée de conservation, base légale et sous-traitants à compléter</Placeholder>
        </p>
      </Section>

      <Section title="5. Cookies">
        <p>
          Le service utilise un seul cookie, nommé <code className="text-signal">token</code>, qui maintient ta session
          de connexion. Il est strictement nécessaire au fonctionnement et n'est utilisé à aucune fin publicitaire.
        </p>
      </Section>

      <Section title="6. Données de tiers">
        <p>
          Les informations sur les séries et les films (titres, affiches, dates de diffusion) proviennent de l'API de
          TMDB. Les contenus restent la propriété de leurs ayants droit. Ce service n'est ni approuvé ni certifié par
          TMDB.
        </p>
      </Section>

      <Section title="7. Disponibilité et responsabilité">
        <p>
          Le service est fourni en l'état. Il peut être interrompu pour maintenance ou pour des raisons techniques. Les
          dates de diffusion et les listes d'épisodes proviennent de sources tierces : leur exactitude n'est pas
          garantie.
        </p>
      </Section>

      <Section title="8. Modifications">
        <p>
          Ces conditions peuvent évoluer. La version en vigueur est celle publiée sur le site. Continuer à utiliser le
          service après une modification vaut acceptation.
        </p>
      </Section>

      <Section title="9. Droit applicable">
        <p>
          <Placeholder>droit applicable et juridiction compétente à compléter</Placeholder>
        </p>
      </Section>
    </LegalPage>
  );
}

export function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales">
      <Section title="Éditeur du site">
        <ul className="space-y-2">
          <li>
            Nom ou raison sociale : <Placeholder>à compléter</Placeholder>
          </li>
          <li>
            Statut : <Placeholder>particulier ou entreprise, numéro d'immatriculation le cas échéant</Placeholder>
          </li>
          <li>
            Adresse : <Placeholder>à compléter</Placeholder>
          </li>
          <li>
            Contact : <Placeholder>adresse email à compléter</Placeholder>
          </li>
          <li>
            Directeur de la publication : <Placeholder>à compléter</Placeholder>
          </li>
        </ul>
      </Section>

      <Section title="Hébergement">
        <p>
          Hébergeur : <Placeholder>nom, adresse et contact de l'hébergeur à compléter</Placeholder>
        </p>
      </Section>

      <Section title="Données de tiers">
        <p>
          Les informations sur les séries et les films proviennent de l'API de TMDB. Ce service n'est ni approuvé ni
          certifié par TMDB.
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          Le code et la mise en page de TV Tracker sont protégés. Les affiches, titres et visuels des œuvres
          appartiennent à leurs ayants droit et sont affichés à titre d'information.
        </p>
      </Section>

      <Section title="Données personnelles et contact">
        <p>
          Pour exercer tes droits sur tes données, écris à l'adresse de contact ci-dessus. Le détail du traitement
          figure dans les{' '}
          <a href="/cgu" className="text-signal underline-offset-4 hover:underline">
            conditions générales d'utilisation
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
