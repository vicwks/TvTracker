// Champ de formulaire des pages de connexion et d'inscription. Le filet du bas se dessine depuis le centre
// quand le champ a le focus (couleur signal), ou reste rouge en cas d'erreur.
export default function AuthField({ id, label, hint, error, suffix, ...inputProps }) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="group">
      <label
        htmlFor={id}
        className="block text-sm text-paper transition-colors duration-300 group-focus-within:text-signal"
      >
        {label}
      </label>
      <div className="relative mt-1 flex items-center gap-3">
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-paper placeholder:text-ink-muted/60 focus:outline-none"
          {...inputProps}
        />
        {suffix}
        <span aria-hidden="true" className={`absolute inset-x-0 -bottom-px h-px ${error ? 'bg-danger' : 'bg-ink-line'}`} />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 -bottom-px h-px origin-center scale-x-0 bg-signal transition-transform duration-500 ease-out group-focus-within:scale-x-100 motion-reduce:transition-none"
        />
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="mt-1.5 hidden text-sm text-ink-muted sm:block">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
