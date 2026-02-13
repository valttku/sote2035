"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { translations } from "./languages";
import { LanguageCode, Translations } from "./types";

type LanguageContextType = {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>("en"); // same on server + client

useEffect(() => {
  const storedLang = localStorage.getItem("lang") as LanguageCode | null;
  if (storedLang) {
    setLang(storedLang);
  }
}, []);


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
  if (!context) throw new Error("useTranslation must be used inside LanguageProvider");
  return context;
}
