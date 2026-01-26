"use client";

// Dark Mode Toggle Component
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <button
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="px-3 py-1 rounded-md 
                 bg-gray-200 dark:bg-gray-700 
                 text-gray-900 dark:text-gray-200 
                 hover:bg-gray-300 dark:hover:bg-gray-600 
                 transition"
    >
      {currentTheme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
