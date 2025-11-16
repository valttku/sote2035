"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const [user, setUser] = useState<
    { email: string; display_name: string | null } | null
  >(null);

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("http://localhost:4000/api/v1/me", {
          credentials: "include",
        });

        if (!res.ok) {
          // not logged in = go to login page
          router.replace("/login");
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  // while loading /me, render nothing
  if (loading) return null;

  // ff somehow no user (shouldn't happen), force login
  if (!user) {
    router.replace("/login");
    return null;
  }

  const displayName = user.display_name || user.email;

  return (
    <aside className="fixed left-0 top-0 h-full w-64">
      <div>
        <p>{displayName}</p>

        <nav>
          <ul className="flex flex-col gap-4 mt-6">
            <li><Link href="/calendar">Calendar</Link></li>
            <li><Link href="/settings">Settings</Link></li>
          </ul>
        </nav>
      </div>

      <button className="mt-auto">Log off</button>
    </aside>
  );
}
