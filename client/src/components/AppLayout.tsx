import { ReactNode } from "react";
import Navbar from "./NavBar/Navbar";
//import SyncButton from "./SyncButton";

export default function AppLayout({
  children,
  hideSidebar,
}: {
  children: ReactNode;
  hideSidebar?: boolean;
}) {
  return (
    <div className="h-dvh flex flex-col overflow-hidden">
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
