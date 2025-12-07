"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("http://localhost:4000/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    router.replace("/login");
  }

  return (
    <button onClick={handleLogout} className="text-red-600 underline">
      Log off
    </button>
  );
}
