"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/LanguageProvider";

export default function LogoutButton() {
  const router = useRouter();
  const { t } = useTranslation();

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
      className="w-full text-indigo-200 hover:text-[#f2345d] transition py-2"
    >
      <span className="bi bi-power"></span>
        {t?.auth?.logout ?? "Logout"} {/* safe fallback */}
    </button>
  );
}


