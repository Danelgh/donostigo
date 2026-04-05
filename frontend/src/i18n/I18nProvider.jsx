import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LANGUAGE_STORAGE_KEY = "donostigo-language";
const DEFAULT_LANGUAGE = "es";

const LOCALE_CODES = {
  es: "es-ES",
  en: "en-GB",
  eu: "eu-ES"
};

export const LANGUAGE_OPTIONS = [
  { value: "es", shortLabel: "ES", label: "Español" },
  { value: "en", shortLabel: "EN", label: "English" },
  { value: "eu", shortLabel: "EU", label: "Euskara" }
];

const I18nContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  localeCode: LOCALE_CODES[DEFAULT_LANGUAGE]
});

function resolveInitialLanguage() {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (storedLanguage && LOCALE_CODES[storedLanguage]) {
    return storedLanguage;
  }

  const browserLanguage = window.navigator.language?.slice(0, 2)?.toLowerCase();

  if (browserLanguage && LOCALE_CODES[browserLanguage]) {
    return browserLanguage;
  }

  return DEFAULT_LANGUAGE;
}

function interpolate(template, variables = {}) {
  if (typeof template !== "string") {
    return template;
  }

  return template.replace(/\{\{(.*?)\}\}/g, (_match, key) => {
    const trimmedKey = key.trim();
    return variables[trimmedKey] ?? "";
  });
}

export function pick(copy, language = DEFAULT_LANGUAGE, variables = {}) {
  if (typeof copy === "string") {
    return interpolate(copy, variables);
  }

  if (!copy || typeof copy !== "object") {
    return copy;
  }

  return interpolate(copy[language] ?? copy[DEFAULT_LANGUAGE] ?? "", variables);
}

export function formatLocaleDate(value, language = DEFAULT_LANGUAGE, options = {}) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString(LOCALE_CODES[language] || LOCALE_CODES.es, options);
}

export function formatLocaleDateTime(value, language = DEFAULT_LANGUAGE, options = {}) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString(LOCALE_CODES[language] || LOCALE_CODES.es, options);
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(resolveInitialLanguage);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }

    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      localeCode: LOCALE_CODES[language] || LOCALE_CODES.es
    }),
    [language]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
