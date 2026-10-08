import PosterSlider from './PosterSlider.jsx';

// Mise en page commune aux pages de connexion et d'inscription. Pas de défilement de page :
// tout tient dans la hauteur de l'écran, le formulaire se resserre si besoin.
// Grand écran : carrousel d'affiches plein fond à gauche, formulaire à droite.
// Mobile : carrousel en bandeau en haut, formulaire dessous.
export default function AuthLayout({ headline, intro, title, footer, children }) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-ink font-ui text-paper lg:grid lg:grid-cols-[1.15fr_1fr]">
      <PosterSlider className="auth-hero h-[32dvh] shrink-0 px-6 pb-6 pt-6 sm:px-12 lg:h-auto lg:px-16 lg:py-14">
        <div className="flex flex-col gap-6 lg:gap-16">
          <p className="font-display text-lg font-medium text-paper">TV Tracker</p>
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl font-medium leading-[1.02] tracking-tight [text-wrap:balance] sm:text-6xl lg:text-[5.5rem]">
              {headline}
            </h1>
            <p className="mt-6 hidden max-w-md text-lg leading-relaxed text-paper/75 sm:block">{intro}</p>
          </div>
        </div>
      </PosterSlider>

      <main className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden border-t border-ink-line bg-ink-soft px-6 py-6 sm:px-12 lg:border-l lg:border-t-0 lg:px-16 lg:py-10">
        <div className="w-full max-w-md">
          <h2 className="font-display text-2xl font-medium text-paper">{title}</h2>
          <div className="mt-6 lg:mt-8">{children}</div>
          <div className="mt-6 text-sm text-ink-muted lg:mt-8">{footer}</div>
        </div>
      </main>
    </div>
  );
}
