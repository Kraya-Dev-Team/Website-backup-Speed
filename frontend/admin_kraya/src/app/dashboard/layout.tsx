"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayoutComponent from "@/components/layout/DashboardLayout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.replace("/");
    if (!isLoading && isLoggedIn && !isAdmin) {
      router.replace("/");
    }
  }, [isLoggedIn, isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-main">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
          <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest animate-pulse">Syncing Admin Context...</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) return null;

  return (
    <DashboardLayoutComponent>
      {children}
    </DashboardLayoutComponent>
  );
}
