"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const apiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  async function handleLogout() {
    await fetch(`${apiUrl}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    // dark mode on homepage after logout
    document.documentElement.classList.add("dark"); // add the dark class
    localStorage.setItem("darkMode", "true");

    router.replace("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="cursor-pointer text-indigo-200 hover:text-[#f2345d] transition"
    >
      <span className="bi bi-power"></span>
      Log off
    </button>
  );
}
