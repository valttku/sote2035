import { ReactNode } from "react";
import Sidebar from "./Sidebar/Sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar displayName={""} />
      <main className="ml-64flex-1 p-4 bg-[var(--background)] text-[var(--foreground)]   min-h-screen">{children}</main>
    </div>
  );
}
