import PosterWall from './PosterWall.jsx';

// Mise en page commune aux pages de connexion et d'inscription.
// Grand écran : un titre immense et des affiches qui défilent à gauche, le formulaire à droite.
// Mobile : une seule colonne, les affiches passent sous le titre.
export default function AuthLayout({ headline, intro, title, footer, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink font-ui text-paper lg:grid lg:grid-cols-[1.15fr_1fr]">
      <div className="flex flex-col overflow-hidden lg:justify-between">
        <header className="flex flex-col gap-10 px-6 pb-8 pt-8 sm:px-12 lg:gap-16 lg:px-16 lg:py-14">
          <p className="font-display text-lg font-medium text-paper">TV Tracker</p>
          <div className="max-w-2xl">
            <h1 className="font-display text-[2.75rem] font-medium leading-[1.02] tracking-tight [text-wrap:balance] sm:text-6xl lg:text-[5.5rem]">
              {headline}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted">{intro}</p>
          </div>
        </header>
        <PosterWall className="pb-8 lg:pb-14" />
      </div>

      <main className="flex-1 border-t border-ink-line bg-ink-soft px-6 py-12 sm:px-12 lg:flex lg:items-center lg:border-l lg:border-t-0 lg:px-16">
        <div className="w-full max-w-md">
          <h2 className="font-display text-2xl font-medium text-paper">{title}</h2>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-sm text-ink-muted">{footer}</div>
        </div>
      </main>
    </div>
  );
}
