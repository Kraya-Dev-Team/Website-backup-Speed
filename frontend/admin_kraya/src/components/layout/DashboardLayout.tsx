"use client";
import React from "react";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { useSidebar } from "@/context/SidebarContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isExpanded, isHovered } = useSidebar();

  return (
    <div className="min-h-screen bg-bg-main selection:bg-brand-500/10">
      <AppSidebar />
      <div
        className={`transition-all duration-300 ease-in-out flex flex-col min-h-screen
          ${isExpanded || isHovered ? "lg:pl-[240px]" : "lg:pl-[88px]"}
        `}
      >
        <AppHeader />
        <main className="flex-1 p-4 sm:p-4 animate-in fade-in duration-500">
          <div className="max-w-[1600px] mx-auto space-y-10">
            {children}
          </div>
        </main>
        
        <footer className="px-8 py-6 text-center">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
             © 2026 KRAYA LUXURY PERFUMES — ADMIN PORTAL
           </p>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
