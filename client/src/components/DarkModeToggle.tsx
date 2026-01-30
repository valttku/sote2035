"use client";

import { useState, useEffect } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

export default function DarkModeToggle() {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

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
      className="flex items-center justify-center gap-2 w-full p-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
    >
      {darkMode ? <FaSun /> : <FaMoon />}
      {darkMode ? "Switch To Light Mode" : "Switch To Dark Mode"}
    </button>
  );
}
