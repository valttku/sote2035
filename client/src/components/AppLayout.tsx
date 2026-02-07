import { ReactNode } from "react";
import Sidebar from "./Sidebar/Sidebar";

export default function AppLayout({ children, hideSidebar }: { children: ReactNode; hideSidebar?: boolean }) {
  return (
    <div className="h-screen">
      {!hideSidebar && <Sidebar />}
      <main className={`flex-1 min-h-screen p-4 sm:p-6 lg:p-8 ${!hideSidebar ? "md:ml-64" : ""}`}>
        {children}
      </main>
    </div>
  );
}

