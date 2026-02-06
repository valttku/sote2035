import { ReactNode } from "react";
import Sidebar from "./Sidebar/Sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen">
      <Sidebar  />

       {/* Main Content */}
      <main className="flex-1 
          min-h-screen
          
          p-4 sm:p-6 lg:p-8   // Responsive padding (mobile → tablet → desktop)

          md:ml-64           // Leaves space for sidebar on desktop
     "
     >
      {children}
      </main>
    </div>
  );
}
