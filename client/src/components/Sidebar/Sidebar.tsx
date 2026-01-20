import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { cookies } from "next/headers";

export default async function Sidebar() {
  const base =
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000";

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
  const res = await fetch("http://localhost:3000/api/v1/me", {
    cache: "no-store",
    headers: {
      // forward cookies explicitly for server fetch
      Cookie: `session=${session}`,
    },
  });

  if (!res.ok) return null;

  const user = await res.json();
  const displayName = user.display_name || user.email;

  return (
    <aside
      className="
      ui-component-styles
      fixed left-0 top-0 h-full w-64 p-4
      flex flex-col
      shrink-0
      rounded-r-3xl
      ui-component-styles
    "
    >
      <div>
        <h2 className="text-3xl  mb-4">Digital Twin</h2>
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
          </ul>
        </nav>
      </div>

      <div className="mt-auto">
        <LogoutButton />
      </div>
    </aside>
  );
}
