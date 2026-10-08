import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fr } from './fr.js';
import { en } from './en.js';

// Langue de l'interface. Par défaut : anglais si le navigateur est en anglais, français sinon.
// Le choix est mémorisé sur l'appareil. Il ne sert qu'à l'affichage : rien n'est envoyé au serveur.
const DICTIONARIES = { fr, en };
const LOCALES = { fr: 'fr-FR', en: 'en-GB' };
const STORAGE_KEY = 'tvt-lang';

function readInitialLang() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && DICTIONARIES[stored]) return stored;
  } catch {
    // Stockage indisponible (navigation privée, données bloquées) : on suit le navigateur.
  }
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

function lookup(dictionary, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dictionary);
}

// Choisit la forme singulier/pluriel quand une entrée en propose deux.
function pick(node, count) {
  if (node && typeof node === 'object' && !Array.isArray(node) && 'other' in node) {
    return count === 1 ? node.one : node.other;
  }
  return node;
}

function interpolate(text, vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match));
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const changeLang = useCallback((next) => {
    if (!DICTIONARIES[next]) return;
    setLang(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sans stockage, le choix vaut pour la session en cours.
    }
  }, []);

  const value = useMemo(() => {
    // Une clé absente de la langue courante reprend le français.
    const t = (key, vars) => {
      const node = pick(lookup(DICTIONARIES[lang], key) ?? lookup(fr, key), vars?.count);
      if (node === undefined) return key;
      return typeof node === 'string' ? interpolate(node, vars) : node;
    };
    return { lang, setLang: changeLang, t, locale: LOCALES[lang] };
  }, [lang, changeLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return useContext(LanguageContext);
}
