"use client";
import React from "react";
import { useSidebar } from "@/context/SidebarContext";
import { Menu, Search, Bell, User } from "lucide-react";

const AppHeader: React.FC = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 h-20 bg-white/80 backdrop-blur-md border-b border-border-light px-4 sm:px-8 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-text-body transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="relative hidden md:flex items-center group">
          <Search size={18} className="absolute left-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search Intelligence..." 
            className="h-11 w-64 lg:w-80 pl-11 pr-4 bg-gray-100 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/10 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <button className="relative p-2.5 text-text-body hover:bg-gray-100 rounded-xl transition-all">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-white" />
        </button>

        <div className="h-10 w-[1px] bg-border-light mx-1 hidden sm:block" />

        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-bold text-text-heading leading-none">Admin Authority</span>
            <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest mt-1">Superuser</span>
          </div>
          <div className="h-11 w-11 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 transition-transform group-hover:scale-105">
            <User size={22} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
