'use client';
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
          left-4
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
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}

    
    <aside className="ui-component-styles fixed left-0 top-0 h-full w-64 p-4 flex flex-col shrink-0 rounded-r-3xl">
      <div>
        <h2 className="text-3xl mb-4">Digital Twin</h2>
        <p className="text-lg">{displayName}</p>{" "}
        {/* display name will update after fetch */}
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

      <div className="mt-auto flex flex-col gap-2">
        <DarkModeToggle />
        <LogoutButton />
      </div>
    </aside>
    </>
  );
}
