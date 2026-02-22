"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/LanguageProvider";
import { LanguageCode } from "@/i18n/types";
import { FaGlobe } from "react-icons/fa";

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fi", label: "FI" },
];

type Props = {
  className?: string;
};

const LanguageSelector = ({ className = "" }: Props) => {
  const { lang, setLang } = useTranslation();
  const [open, setOpen] = useState(false);

  const changeLanguage = (newLang: LanguageCode) => {
    setLang(newLang);
    setOpen(false);
  };

  return (
    <div className={`${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-white cursor-pointer select-none px-2 py-1 rounded-md hover:bg-white/10"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <FaGlobe />
        <span className="text-sm font-semibold uppercase">{lang}</span>
        <span
          className={`text-sm transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 min-w-[120px] rounded-lg border border-white/20 bg-black/80 backdrop-blur-md shadow-lg overflow-hidden">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() => changeLanguage(language.code)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 cursor-pointer ${
                lang === language.code ? "text-white" : "text-white/90"
              }`}
              role="menuitem"
            >
              {language.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
