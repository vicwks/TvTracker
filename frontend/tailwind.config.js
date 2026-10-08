/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#2dd4bf', // teal-400 : couleur d'accent principale de l'appli
        'accent-dark': '#0d9488', // teal-600 : hover/états actifs
        // Pages de connexion et d'inscription
        ink: '#0f0e0c', // encre chaude : fond principal
        'ink-soft': '#171511', // panneau du formulaire
        'ink-line': '#2b2822', // filets et séparateurs
        'ink-muted': '#9a9283', // texte secondaire
        paper: '#f4efe6', // texte principal
        signal: '#f5a524', // ambre : focus, bouton principal, liens
        'signal-ink': '#1a1306', // texte posé sur le signal
        danger: '#f07167', // erreurs
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        ui: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        // Dérive très légère : quelques pixels et une rotation de quelques degrés.
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(10px, -14px) rotate(8deg)' },
        },
      },
      animation: {
        marquee: 'marquee 70s linear infinite',
        drift: 'drift 20s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
