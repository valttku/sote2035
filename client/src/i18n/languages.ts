// src/i18n/languages.ts
import enJson from "./locales/en.json";
import fiJson from "./locales/fi.json";
import { Translations, LanguageCode } from "./types";

export const en: Translations = enJson as Translations;
export const fi: Translations = fiJson as Translations;

export const translations: Record<LanguageCode, Translations> = { en, fi };
