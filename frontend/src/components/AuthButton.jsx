// Bouton d'envoi des pages de connexion et d'inscription.
// Survol : léger soulèvement, reflet qui traverse le bouton. Clic : il s'enfonce légèrement.
// Les animations sont retirées si l'utilisateur réduit les mouvements.
export default function AuthButton({ children, disabled, ...buttonProps }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="group relative w-full overflow-hidden rounded-md bg-signal py-3 text-base font-medium text-signal-ink shadow-none transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(245,165,36,0.75)] active:translate-y-0 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none motion-reduce:transform-none motion-reduce:transition-none"
      {...buttonProps}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:left-full group-hover:opacity-100 motion-reduce:hidden"
      />
      <span className="relative">{children}</span>
    </button>
  );
}
