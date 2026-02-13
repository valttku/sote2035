"use client";

import { useTranslation } from "./LanguageProvider";
import { LanguageCode } from "./types";

export default function LanguageSelector() {
  const { lang, setLang } = useTranslation();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value as LanguageCode)}
      className="border rounded p-1"
    >
      <option value="en">English</option>
      <option value="fi">Finnish</option>
    </select>
  );
}
