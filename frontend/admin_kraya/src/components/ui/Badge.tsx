import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "brand" | "gray";
  className?: string;
}

export const Badge = ({ children, variant = "gray", className = "" }: BadgeProps) => {
  const variants = {
    success: "bg-success-50 text-success-600 border-success-500/20",
    warning: "bg-warning-50 text-warning-600 border-warning-500/20",
    error: "bg-error-50 text-error-600 border-error-500/20",
    brand: "bg-brand-50 text-brand-600 border-brand-500/20",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
