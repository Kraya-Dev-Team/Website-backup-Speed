"use client";

import React from "react";

interface LogoProps {
  className?: string;
  isCollapsed?: boolean;
}

export const KrayaLogo: React.FC<LogoProps> = ({ className, isCollapsed }) => {
  if (isCollapsed) {
    return (
      <div className={`flex items-center justify-center h-10 w-10 bg-brand-500 rounded-xl ${className ?? ""}`}>
        <span className="text-white font-black text-xl">K</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <div className="flex items-center justify-center h-8 w-8 bg-brand-500 rounded-lg">
        <span className="text-white font-black text-lg">K</span>
      </div>
      <div className="flex flex-col">
        <span className="text-text-heading font-black text-xl tracking-tighter leading-none">KRAYA</span>
        <span className="text-[8px] font-bold text-brand-600 uppercase tracking-[0.2em] leading-none mt-0.5">Admin Panel</span>
      </div>
    </div>
  );
};
