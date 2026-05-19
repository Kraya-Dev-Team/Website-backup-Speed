import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className = "", ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-[10px] font-black text-text-body/60 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-white border border-border-light rounded-2xl py-3 px-5 text-sm font-semibold text-text-heading outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 transition-all placeholder:text-gray-300 ${
          error ? "border-error-500 focus:ring-error-500/5" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-[10px] font-black text-error-600 ml-1 uppercase tracking-tighter">{error}</span>}
    </div>
  );
};
