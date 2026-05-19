import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = ({ 
  children, 
  variant = "primary", 
  size = "md",
  isLoading, 
  className = "", 
  disabled, 
  ...props 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  
  const variants = {
    primary: "bg-brand-500 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-600",
    secondary: "bg-brand-50 text-brand-600 hover:bg-brand-100",
    danger: "bg-error-50 text-error-600 hover:bg-error-600 hover:text-white",
    ghost: "bg-transparent text-text-body hover:bg-gray-100",
    outline: "bg-transparent border border-border-light text-text-body hover:border-brand-500 hover:text-brand-600",
  };

  const sizes = {
    sm: "py-2 px-4 text-[10px]",
    md: "py-3 px-6 text-xs",
    lg: "py-4 px-8 text-sm",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-sm animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};
