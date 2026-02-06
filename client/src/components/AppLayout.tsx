import { ReactNode } from "react";
import Sidebar from "./Sidebar/Sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 min-h-screen p-4 sm:p-6 lg:p-0 md:ml-64">
        {children}
      </main>
    </div>
  );
}
