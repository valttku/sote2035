"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import DarkModeToggle from "../DarkModeToggle";

export default function Sidebar() {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const res = await fetch(`/api/v1/me`, {
        credentials: "include",
      });

      if (res.ok) {
        const user = await res.json();
        setDisplayName(user.display_name || user.email);
      }
    }

    fetchUser();
  }, []);

  if (!displayName) return null;

  return (
    <aside className="ui-component-styles fixed left-0 top-0 h-full w-64 p-4 flex flex-col shrink-0 rounded-r-3xl">
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

      <div className="mt-auto flex flex-col gap-2">
        <DarkModeToggle />
        <LogoutButton />
      </div>
    </aside>
  );
}
