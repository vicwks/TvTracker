import PosterSlider from './PosterSlider.jsx';
import LanguageSwitch from './LanguageSwitch.jsx';

// Mise en page commune aux pages de connexion et d'inscription. Pas de défilement de page :
// tout tient dans la hauteur de l'écran, le formulaire se resserre si besoin.
// Grand écran : carrousel plein fond à gauche, formulaire à droite, séparés par une coupure en diagonale
// soulignée d'un filet ambre. Mobile : carrousel en bandeau en haut, formulaire dessous.
//
// La diagonale tient à deux éléments qui se complètent : le carrousel est rogné sur son bord droit,
// le panneau du formulaire est rogné sur son bord gauche, avec la même pente (SLANT).
const SLANT = '96px';

export default function AuthLayout({ headline, intro, title, footer, children }) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-ink font-ui text-paper lg:relative lg:block">
      <PosterSlider className="auth-hero h-[32dvh] shrink-0 px-6 pb-6 pt-6 sm:px-12 lg:absolute lg:inset-y-0 lg:left-0 lg:h-auto lg:w-[54%] lg:px-16 lg:py-14 lg:[clip-path:polygon(0_0,100%_0,calc(100%_-_96px)_100%,0_100%)]">
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

      <main
        className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden border-t border-ink-line bg-ink-soft px-6 py-6 sm:px-12 lg:absolute lg:inset-y-0 lg:right-0 lg:left-[calc(54%-96px)] lg:flex lg:items-center lg:border-t-0 lg:pl-40 lg:pr-16 lg:py-10 lg:[clip-path:polygon(96px_0,100%_0,100%_100%,0_100%)]"
      >
        {/* Filet ambre posé sur la diagonale. Visible uniquement sur grand écran. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-signal/70 lg:block"
          style={{ clipPath: `polygon(${SLANT} 0, calc(${SLANT} + 3px) 0, 3px 100%, 0 100%)` }}
        />
        <LanguageSwitch className="absolute right-6 top-5 z-20 sm:right-12" />
        <div className="relative z-10 mx-auto w-full max-w-md">
          <h2 className="font-display text-2xl font-medium text-paper">{title}</h2>
          <div className="mt-6 lg:mt-8">{children}</div>
          <div className="mt-6 text-sm text-ink-muted lg:mt-8">{footer}</div>
        </div>
      </main>
    </div>
  );
}
