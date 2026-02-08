import { ReactNode } from "react";
import Navbar from "./NavBar/Navbar";

export default function AppLayout({ children, hideSidebar }: { children: ReactNode; hideSidebar?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar></Navbar>
      <main className={`flex-1 px-4 sm:px-6 lg:px-8 flex justify-center`}>
        {children}
      </main>
    </div>
  );
}

