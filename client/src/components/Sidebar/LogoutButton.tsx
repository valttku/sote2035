"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch(`/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    router.replace("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="cursor-pointer text-indigo-200 hover:text-[#f2345d] transition text-lg"
    >
      <span className="bi bi-power text-lg"></span>
      Log off
    </button>
  );
}
