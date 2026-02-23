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
     className="relative w-15 h-7 rounded-full flex items-center px-1
    bg-gradient-to-r from-indigo-500/40 to-cyan-500/40
    dark:from-indigo-900 dark:to-purple-900
    border border-white/20
    backdrop-blur-md
    transition-all duration-500"
    aria-label="Toggle theme"
  >
     {/* Glow Track */}
    <div className="absolute inset-0 rounded-full
      bg-gradient-to-r
      from-indigo-400/30 to-cyan-400/30
      dark:from-purple-700/40 dark:to-indigo-800/40
      blur-sm
      transition-all duration-500"
    />

    {/* Sliding Knob */}
    <div
      className={`relative z-10 w-5 h-5 rounded-full
      flex items-center justify-center
      bg-white/80 dark:bg-white/10
      border border-white/30
      shadow-md
      transform transition-all duration-500
      ${darkMode ? "translate-x-8" : "translate-x-0"}`}
    >
      {darkMode ? (
        <FaMoon className="text-purple-300 text-sm" />
      ) : (
        <FaSun className="text-yellow-600 text-sm animate-pulse" />
      )}
    </div>

      {/* Subtle stars in dark mode */}
    {darkMode && (
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-1 left-3 text-purple-200 text-[6px] animate-pulse">✦</span>
        <span className="absolute bottom-1 right-3 text-indigo-200 text-[6px] animate-pulse">✦</span>
      </div>
    )}
  </button>
);
}




  
