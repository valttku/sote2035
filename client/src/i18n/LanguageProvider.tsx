"use client";

import { useEffect, createContext, useContext, useState, ReactNode } from "react";
import { translations } from "./languages";
import { LanguageCode, Translations } from "./types";

type LanguageContextType = {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start with "en" so server and client render the same initial HTML,
  // avoiding a hydration mismatch when the stored language differs from the default
  const [lang, setLang] = useState<LanguageCode>("en");

  // After mount, read the stored language from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("lang") as LanguageCode | null;
    if (stored && stored !== lang) setLang(stored);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync lang to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useTranslation must be used inside LanguageProvider");
  return context;
}