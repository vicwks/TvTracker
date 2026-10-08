// Bouton œil pour afficher ou masquer un mot de passe.
// Mot de passe masqué : œil ouvert (cliquer pour afficher). Mot de passe affiché : œil barré (cliquer pour masquer).
export default function PasswordToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      aria-pressed={visible}
      className="shrink-0 rounded p-1 text-ink-muted transition hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {visible ? (
          <>
            <path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.1 4" />
            <path d="M6.6 6.6A17.5 17.5 0 0 0 2 12s3.5 7 10 7a10.4 10.4 0 0 0 5.4-1.5" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            <path d="M3 3l18 18" />
          </>
        ) : (
          <>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
      </svg>
    </button>
  );
}
