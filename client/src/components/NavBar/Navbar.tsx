"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import DarkModeToggle from "../DarkModeToggle";
import LogoutButton from "./LogoutButton";
import {
  FaHome,
  FaCalendarAlt,
  FaHeartbeat,
  FaCog,
  FaGlobe,
} from "react-icons/fa";
import { translations, LanguageCode } from "../../i18n/languages";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const [language, setLanguage] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as LanguageCode) || "en";
    }
    return "en";
  });

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  const navItems = [
    { label: t.navbar.home, path: "/", icon: <FaHome /> },
    { label: t.navbar.calendar, path: "/calendar", icon: <FaCalendarAlt /> },
    { label: t.navbar.health, path: "/health-insights", icon: <FaHeartbeat /> },
    { label: t.navbar.settings, path: "/settings", icon: <FaCog /> },
  ];

  useEffect(() => {
    localStorage.setItem("lang", language);
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
    <>
      {/* DESKTOP NAVBAR */}
      <header className="ui-component-styles hidden md:flex w-full max-w-screen-xl mx-auto mt-6 px-6 h-16 items-center justify-between shadow-sm">
        {" "}
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Digital Twin</h2>
          {/* <img src="/logo.png" alt="logo" className="h-10 w-auto" /> removed logo for now*/}
        </div>
        <nav className="hidden md:flex gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-2 font-medium ${
                pathname === item.path ? "text-white" : "text-gray-200"
              } hover:text-[#31c2d5] transition-colors duration-200`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          {/* Language */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="text-white text-xl hover:text-blue-300"
            >
              <FaGlobe />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-20 bg-gray-800 text-white rounded shadow-lg z-50">
                <button
                  onClick={() => setLanguage("en")}
                  className={`block w-full px-4 py-2 hover:bg-gray-700 ${
                    language === "en" ? "font-bold" : ""
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage("fi")}
                  className={`block w-full px-4 py-2 hover:bg-gray-700 ${
                    language === "fi" ? "font-bold" : ""
                  }`}
                >
                  FI
                </button>
              </div>
            )}
          </div>

          <DarkModeToggle />
          <LogoutButton />
        </div>
      </header>

      {/* MOBILE MENU BUTTON */}
      <button
        className="md:hidden fixed top-4 right-4 z-50 ui-component-styles px-3 py-2 rounded-xl"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

      {/* DARK OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR */}
      <aside
        className={`ui-component-styles fixed top-0 right-0 h-full w-64 bg-gray-900 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="flex flex-col p-6 gap-4 h-full">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 text-lg ${
                pathname === item.path ? "text-[#31c2d5]" : "text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          {/* Bottom section: Dark mode + Logout */}
          <div className="mt-auto pt-6 border-t border-gray-700 flex flex-col gap-2">
            <DarkModeToggle />
            <LogoutButton />
          </div>
        </nav>
      </aside>

      {/* Prevent scrolling behind open sidebar */}
      {open && (
        <style>{`
    body {
      overflow: hidden;
    }
  `}</style>
      )}
    </>
  );
}
