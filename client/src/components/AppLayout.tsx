import { ReactNode } from "react";
import Navbar from "./NavBar/Navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <Navbar /> {/* Only here, not in RootLayout */}
      <main className="flex-1 p-8">{children}</main>
      <Navbar></Navbar>
      <main
        className={`flex-1 p-8 px-4 sm:px-6 lg:px-8 flex justify-center overflow-y-auto`}
      >
        {children}
      </main>
      {/*<SyncButton />*/}
    </div>
  );
}
