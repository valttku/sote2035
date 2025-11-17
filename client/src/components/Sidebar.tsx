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

  // Load user data
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("http://localhost:4000/api/v1/me", {
          credentials: "include",
        });

        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          setUser(data);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  // Redirect ONLY after loading, and ONLY inside useEffect
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // While checking session, show nothing
  if (loading) return null;

  // After redirect triggers, also render nothing
  if (!user) return null;

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

      <button
        className="mt-auto"
        onClick={async () => {
          await fetch("http://localhost:4000/api/v1/auth/logout", {
            method: "POST",
            credentials: "include",
          });
          router.replace("/login");
        }}
      >
        Log off
      </button>
    </aside>
  );
}
