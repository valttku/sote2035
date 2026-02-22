import { ReactNode } from "react";
import Navbar from "./navbar/Navbar";
import LanguageSelector from "./language-selector/LanguageSelector";
import AppLogo from "./app-logo/AppLogo";
import LogoutButton from "./navbar/LogoutButton";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
  hideSidebar?: boolean;
}) {
  return (
    <div className="h-dvh flex flex-col">
      <div className="relative w-full">
        <AppLogo />
        <Navbar />

        <div className="hidden md:flex absolute right-6 top-4 z-50 items-center gap-3">
          <LanguageSelector className="relative inline-block " />
          <div className="h-5 w-px bg-white/30" />
          <LogoutButton />
        </div>
      </div>

      <main className="flex-1 p-8 px-4 sm:px-6 lg:px-8 flex justify-center overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
