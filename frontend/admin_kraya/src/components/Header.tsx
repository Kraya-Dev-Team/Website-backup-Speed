"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex w-full bg-white border-b border-border-subtle h-20">
      <div className="flex flex-grow items-center justify-between px-6 md:px-10">
        {/* Left side: Search bar */}
        <div className="flex-1 max-w-md hidden md:block">
           <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-50 text-base">🔍</span>
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="w-full bg-body-bg border-none rounded-full py-2.5 pl-12 pr-6 text-sm outline-none focus:ring-2 ring-primary/10 transition-all placeholder:text-text-muted/60"
              />
           </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-4">
             <div className="text-right">
                <p className="text-sm font-black text-text-main leading-tight">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">{user?.role || "Admin"}</p>
             </div>
             <div className="h-11 w-11 rounded-full border-2 border-primary/10 p-0.5 overflow-hidden">
                <div className="h-full w-full bg-primary/5 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                   {user?.firstName?.[0] || "A"}
                </div>
             </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-danger/5 text-danger hover:bg-danger hover:text-white transition-all active:scale-90"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
