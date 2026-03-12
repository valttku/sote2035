"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import DarkModeToggle from "./DarkModeToggle";
import LogoutButton from "./LogoutButton";
import { FaRobot } from "react-icons/fa";

//  Import your translation hook and types
import { useTranslation } from "@/i18n/LanguageProvider";

import { FaHome, FaCalendarAlt, FaHeartbeat, FaCog } from "react-icons/fa";
import LanguageSelector from "../language-selector/LanguageSelector";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();

  const navItems = [
    { label: t.navbar.home, path: "/", icon: <FaHome /> },
    { label: t.navbar.calendar, path: "/calendar", icon: <FaCalendarAlt /> },
    { label: t.navbar.health, path: "/health-insights", icon: <FaHeartbeat /> },
    { label: t.chat.title, path: "/chat", icon: <FaRobot /> },
    { label: t.navbar.settings, path: "/settings", icon: <FaCog /> },
  ];

  return (
    <>
      <header className="hidden md:block w-full border-b border-white/15 bg-black/20 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="w-40" />
          <nav className="flex gap-10">
            {navItems.map((item) => {
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 font-medium transition-colors duration-200 ${
                    active ? "text-[#31c2d5]" : "text-white/90"
                  } hover:text-[#31c2d5]`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <DarkModeToggle />
          </div>

          <div className="w-40 flex items-center justify-end gap-3"></div>
        </div>
      </header>

      {/* MOBILE MENU BUTTON */}
      <button
        className="md:hidden fixed top-4 right-4 z-[70] ui-component-styles px-3 py-2 rounded-xl touch-manipulation"
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

          <LanguageSelector />
          <DarkModeToggle />

          <div className="mt-auto text-center">
            <LogoutButton />
          </div>
        </nav>
      </aside>

      {/* Prevent scrolling behind open sidebar */}
      {open && (
        <style>
          {`
          body {
            overflow: hidden;
          }`}
        </style>
      )}
    </>
  );
}
