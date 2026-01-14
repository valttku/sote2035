import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { cookies } from "next/headers";

export default async function Sidebar() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const cookieStore = await cookies();
  let session = "";

  for (const c of cookieStore.getAll()) {
    if (c.name === "session") {
      session = c.value;
      break;
    }
  }

  if (!session) {
    return null; // proxy.ts will redirect
  }

  // fetch user info from backend
  const res = await fetch(`${base}/api/v1/me`, {
    method: "GET",
    headers: {
      Cookie: `session=${session}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const user = await res.json();
  const displayName = user.display_name || user.email;

  return (
    <aside className="
      fixed left-0 top-0 h-full w-64 p-4
      bg-indigo-950/80
      border border-[rgba(179,196,243,0.8)]
      rounded-r-2xl
      shadow-lg"
    >
      <div>
        <p className="font-bold text-lg">{displayName}</p>

        <nav>
          <ul className="flex flex-col gap-4 mt-6">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/calendar">Calendar</Link>
            </li>
            <li>
              <Link href="/settings">Settings</Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="mt-8">
        <LogoutButton />
      </div>
    </aside>
  );
}
