import { ReactNode } from "react";
import Sidebar from "./Sidebar/Sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar  />
      <main className="ml-64 flex-1 p-4 min-h-screen">{children}</main>
    </div>
  );
}
