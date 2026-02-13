"use client";

import { useState, useEffect } from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import { useTranslation } from "@/i18n/LanguageProvider";


export default function DarkModeToggle() {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { t } = useTranslation();


  useEffect(() => {
    // wrap in setTimeout to avoid calling setState synchronously in the effect body
    setTimeout(() => {
      const saved = localStorage.getItem("darkMode");
      if (saved === "true") {
        document.documentElement.classList.add("dark");
        setDarkMode(true);
      } else {
        document.documentElement.classList.remove("dark");
        setDarkMode(false);
      }
      setMounted(true);
    }, 0);
  }, []);

  if (!mounted) return null;

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="
        flex items-center justify-center gap-2 min-w-[120px] 
        p-1 rounded-xl
        bg-white/25 dark:bg-white/10
        border border-white/30 dark:border-white/15
        hover:bg-white/35 dark:hover:bg-white/20
        transition-all duration-300
        shadow-sm
      "
    >
      {darkMode ? <FaSun /> : <FaMoon />}
     {darkMode
  ? t?.darkmodetoggle?.darkMode ?? "Dark Mode"
  : t?.darkmodetoggle?.lightMode ?? "Light Mode"}
</button>
  );
}




  
