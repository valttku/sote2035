import { ReactNode } from "react";
import Navbar from "./navbar/Navbar";
import LanguageSelector from "./language-selector/LanguageSelector";
import AppLogo from "./app-logo/AppLogo";
import LogoutButton from "./navbar/LogoutButton";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* Header */}
      <div className="relative shrink-0">
        <AppLogo />
        <Navbar />

        <div className="hidden md:flex absolute right-6 top-4 z-50 items-center gap-3">
          <LanguageSelector />
          <div className="h-5 w-px bg-white/30" />
          <LogoutButton />
        </div>
      </div>

      {/* Scroll Bar */}
      <main className="flex-1 overflow-y-auto">
        <div className="flex justify-center px-4 sm:px-6 lg:px-8 py-6">
          <div className="w-full max-w-5xl">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}