"use client";
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64">
      <div>
        <p>Username</p>

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
