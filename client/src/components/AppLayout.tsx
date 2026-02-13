import { ReactNode } from "react";
import Navbar from "./NavBar/Navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <Navbar /> {/* Only here, not in RootLayout */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
