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
  // Lazy initialization reads localStorage only on first render
  const [lang, setLang] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "en"; // SSR safe
    return (localStorage.getItem("lang") as LanguageCode) ?? "en";
  });

  // Sync lang to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", lang);
    }
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
