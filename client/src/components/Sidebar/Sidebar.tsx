"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DarkModeToggle from "../DarkModeToggle";
import LogoutButton from "./LogoutButton";

export default function Sidebar() {
  const [displayName, setDisplayName] = useState("");
  const [open, setOpen] = useState(false); //controls mobile sidebar

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/v1/me`, {
          credentials: "include",
        });

        if (res.ok) {
          const user = await res.json();
          setDisplayName(user.display_name);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  return (
    <>
      {/*  MOBILE MENU BUTTON */}
      <button
        className="
          md:hidden
          fixed
          top-4
          right-4
          z-50
          ui-component-styles
          px-3
          py-2
          rounded-xl
        "
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>
      {/* DARK OVERLAY when sidebar opens */}
      {open && (
        <div
          className="fixed inset-0 backdrop-blur-xl z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
        ui-component-styles
        fixed top-0 left-0 h-full w-64 p-4 flex flex-col shrink-0 rounded-r-3xl
        bg-white dark:bg-gray-900
        transform transition-transform duration-300
        md:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}
        z-50
     `}
      >
        <div>
          <h2 className="text-3xl mb-4">Digital Twin</h2>
          <p className="text-lg">{displayName}</p>{" "}
          {/* display name will update after fetch */}
          <nav>
            <ul className="flex flex-col gap-4 mt-6">
              <hr />
              <li>
                <Link href="/" onClick={() => setOpen(false)}>
                  Home
                </Link>
              </li>
              <hr />
              <li>
                <Link href="/calendar" onClick={() => setOpen(false)}>
                  Calendar
                </Link>
              </li>
              <hr />
              <li>
                <Link href="/settings" onClick={() => setOpen(false)}>
                  Settings
                </Link>
              </li>
              <hr />
              <li>
                <Link href="/health-insights" onClick={() => setOpen(false)}>
                  Health Insights
                </Link>
              </li>
              <hr />
            </ul>
          </nav>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <DarkModeToggle />
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
