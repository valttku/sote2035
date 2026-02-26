"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
 

  async function handleLogout() {
    await fetch(`/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    router.replace("/startup");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-indigo-200 hover:text-[#f2345d] transition px-2 py-1 whitespace-nowrap"
    >
      <span className="bi bi-power"></span>
    </button>
  );
}
