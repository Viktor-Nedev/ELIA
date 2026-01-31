"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/AuthContext";

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const noSidebarPages = ["/login", "/signup"];
  const isAuthPage = noSidebarPages.includes(pathname);

  if (loading) return <>{children}</>;

  // Only show sidebar if user is logged in and not on an auth page
  const showSidebar = user && !isAuthPage;

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <Sidebar />
      <main className="flex-1 lg:pl-72 w-full transition-all duration-300">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
