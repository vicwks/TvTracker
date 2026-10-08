/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#2dd4bf', // teal-400 : couleur d'accent principale de l'appli
        'accent-dark': '#0d9488', // teal-600 : hover/états actifs
      },
    },
  },
  plugins: [],
};
