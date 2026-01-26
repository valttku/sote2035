
"use client"; // needed because we use useState and useEffect

import Link from "next/link";
import { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton"; // adjust path if needed
import { FaMoon, FaSun } from "react-icons/fa";

export default function Sidebar() {
  const [displayName, setDisplayName] = useState("User"); // replace with actual data if available
  const [darkMode, setDarkMode] = useState(false);

  // On mount, load saved dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
      setDarkMode(true);
    }
  };

  return (
    <aside
      className="
        ui-component-styles
        fixed left-0 top-0 h-full w-64 p-4
        flex flex-col
        shrink-0
        rounded-r-3xl
      "
    >
      <div>
        <h2 className="text-3xl mb-4">Digital Twin</h2>
        <p className="text-lg">{displayName}</p>

        <nav>
          <ul className="flex flex-col gap-4 mt-6">
            <hr />
            <li>
              <Link href="/">Home</Link>
            </li>
            <hr />
            <li>
              <Link href="/calendar">Calendar</Link>
            </li>
            <hr />
            <li>
              <Link href="/settings">Settings</Link>
            </li>
            <hr />
            <li>
              <Link href="/health-insights">Health Insights</Link>
            </li>
            <hr />
          </ul>
        </nav>
      </div>

      {/* Dark Mode Toggle */}
      <div className="mt-auto flex flex-col gap-2">
        <button
          onClick={toggleDarkMode}
          className="flex items-center justify-center gap-2 w-full p-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>

        {/* Logout Button below dark mode toggle */}
        <LogoutButton />
      </div>
    </aside>
  );
}
