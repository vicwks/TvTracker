// Champ de formulaire des pages de connexion et d'inscription : simple filet souligné,
// le filet passe en couleur signal quand le champ a le focus.
export default function AuthField({ id, label, hint, error, suffix, ...inputProps }) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm text-paper">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-3 border-b border-ink-line transition-colors focus-within:border-signal">
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-paper placeholder:text-ink-muted/60 focus:outline-none"
          {...inputProps}
        />
        {suffix}
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="mt-1.5 text-sm text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
