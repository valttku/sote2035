import React, { useRef, useState, useEffect } from "react";
import { FaGlobe } from "react-icons/fa";
import { useTranslation } from "@/i18n/LanguageProvider";
import { LanguageCode } from "@/i18n/types";

const LanguageSelector: React.FC = () => {
  const [language, setLanguage] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as LanguageCode) || "en";
    }
    return "en";
  });
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { t, setLang } = useTranslation();

  useEffect(() => {
    localStorage.setItem("lang", language);
    window.dispatchEvent(
      new CustomEvent("languageChange", { detail: language }),
    );
  }, [language]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={langRef}>
      <button
        onClick={() => setLangOpen(!langOpen)}
        className="
        flex items-center justify-center gap-2 
        min-w-[120px] w-full p-1 rounded-xl
        bg-white/25 dark:bg-white/10
        border border-white/30 dark:border-white/15
        hover:bg-white/35 dark:hover:bg-white/20
        transition-all duration-300
        shadow-sm"
      >
        <FaGlobe />
        {t.navbar.language}
      </button>
      {langOpen && (
        <div className="absolute right-0 mt-2 w-24 bg-gray-800 text-white rounded shadow-lg z-50">
          <button
            onClick={() => {
              setLanguage("en");
              setLang("en");
              setLangOpen(false);
            }}
            className={`block w-full px-4 py-2 hover:bg-gray-700 ${language === "en" ? "font-bold" : ""}`}
          >
            EN
          </button>
          <button
            onClick={() => {
              setLanguage("fi");
              setLang("fi");
              setLangOpen(false);
            }}
            className={`block w-full px-4 py-2 hover:bg-gray-700 ${language === "fi" ? "font-bold" : ""}`}
          >
            FI
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
