"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const [user, setUser] = useState<{ email: string; display_name: string | null } | null>(null);
  const router = useRouter();

  // load user data
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("http://localhost:4000/api/v1/me", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch {
        // theoretically should never happen due to middleware
      }
    }

    loadUser();
  }, []);

  if (!user) return null;

  const displayName = user.display_name || user.email;

  async function handleLogout() {
    await fetch("http://localhost:4000/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.replace("/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 p-4 border-r">
      <div className="mb-8">
        <p className="font-bold">{displayName}</p>

        <nav>
          <ul className="flex flex-col gap-4 mt-6">
            <li><Link href="/calendar">Calendar</Link></li>
            <li><Link href="/settings">Settings</Link></li>
          </ul>
        </nav>
      </div>

      <button onClick={handleLogout} className="mt-auto">
        Log off
      </button>
    </aside>
  );
}
