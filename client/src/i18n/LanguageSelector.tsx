"use client";

import { languages, LanguageCode } from "./languages";

interface Props {
  currentLang: LanguageCode;
  onChange: (lang: LanguageCode) => void;
}

export default function LanguageSelector({ currentLang, onChange }: Props) {
  return (
    <select
      className="border rounded p-2"
      value={currentLang}
      onChange={(e) => onChange(e.target.value as LanguageCode)}
    >
      {languages.map((lang) => (
        <option key={lang} value={lang}>
          {lang.toUpperCase()} {/* "EN" / "FI" */}
        </option>
      ))}
    </select>
  );
}
