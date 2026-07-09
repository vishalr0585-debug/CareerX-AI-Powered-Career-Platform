"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./sidebar";
import Header from "./header";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

interface SidebarContextType {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  mobileOpen: false,
  setMobileOpen: () => {},
  collapsed: false,
  setCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    fetchUser().finally(() => setReady(true));
  }, [fetchUser]);

  useEffect(() => {
    if (ready && !isLoading && !isAuthenticated && !redirecting) {
      setRedirecting(true);
      // Clear the token cookie so middleware also knows
      if (typeof document !== "undefined") {
        document.cookie = "has_token=;path=/;max-age=0";
      }
      router.replace("/login");
    }
  }, [ready, isLoading, isAuthenticated, router, redirecting]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [children]);

  if (!ready || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{redirecting ? "Redirecting..." : "Loading CareerX..."}</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen, collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background">
        {/* Background */}
        <div className="fixed inset-0 -z-10 bg-background" />

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <Sidebar />
        <div className={`transition-all duration-500 ${collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"}`}>
          <Header />
          <main className="p-4 sm:p-6 max-w-[1600px] page-enter-stagger">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
