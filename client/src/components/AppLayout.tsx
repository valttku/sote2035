import { ReactNode } from "react";
import Sidebar from "./Sidebar/Sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen">
      <Sidebar  />
      <main className="ml-64 flex-1 ">{children}</main>
    </div>
  );
}
